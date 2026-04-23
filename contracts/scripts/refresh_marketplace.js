const Marketplace = artifacts.require("Marketplace");
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
    
    console.log("Re-deploying Marketplace...");
    // Since it's upgradeable but we are doing a "reset" style deploy for the fix:
    const marketplaceInstance = await Marketplace.new(forwarder.address);
    await marketplaceInstance.initialize(ac.address, token.address);
    
    console.log("Authorizing Marketplace in AccessControl...");
    await ac.setAuthorizedManager(marketplaceInstance.address, true);
    console.log(`New Marketplace deployed and authorized at: ${marketplaceInstance.address}`);

    // Sync files
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts', 'Marketplace.json');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts', 'Marketplace.json');
    
    const contractData = {
        abi: Marketplace.abi,
        networks: {
            [networkId]: {
                address: marketplaceInstance.address
            }
        }
    };
    
    [frontendPath, serverPath].forEach(filePath => {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        // Read existing if exists to keep other network info
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
