const Insurance = artifacts.require("Insurance");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function(callback) {
  try {
    const ac = await MediSecureAccessControl.deployed();
    const forwarder = await SanjeevniMockForwarder.deployed();
    const token = await SanjeevniToken.deployed();
    
    console.log("Re-deploying Insurance...");
    const dummyVRF = "0x0000000000000000000000000000000000000001";
    const insuranceInstance = await Insurance.new(forwarder.address, dummyVRF, { gas: 6000000 });
    await insuranceInstance.initialize(ac.address, token.address, 0, "0x0000000000000000000000000000000000000000000000000000000000000000", 0);
    
    console.log("Authorizing Insurance in AccessControl...");
    await ac.setAuthorizedManager(insuranceInstance.address, true);
    console.log(`New Insurance deployed and authorized at: ${insuranceInstance.address}`);

    // Sync files
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts', 'Insurance.json');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts', 'Insurance.json');
    
    const contractData = {
        abi: Insurance.abi,
        networks: {
            [networkId]: {
                address: insuranceInstance.address
            }
        }
    };
    
    [frontendPath, serverPath].forEach(filePath => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        let finalData = contractData;
        if(fs.existsSync(filePath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                finalData.networks = { ...existing.networks, ...contractData.networks };
            } catch(e) {}
        }
        
        fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2));
        console.log(`Updated ${path.basename(filePath)}`);
    });

    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
