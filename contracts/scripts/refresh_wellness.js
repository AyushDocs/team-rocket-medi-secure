const WellnessRewards = artifacts.require("WellnessRewards");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const InsuranceVerifier = artifacts.require("InsuranceVerifier");
const fs = require('fs');
const path = require('path');

module.exports = async function(callback) {
  try {
    const ac = await MediSecureAccessControl.deployed();
    const forwarder = await SanjeevniMockForwarder.deployed();
    const token = await SanjeevniToken.deployed();
    
    let verifierAddress = "0x0000000000000000000000000000000000000000";
    try {
       const verifier = await InsuranceVerifier.deployed();
       verifierAddress = verifier.address;
    } catch(e) {}

    console.log("Re-deploying WellnessRewards...");
    const wellnessInstance = await WellnessRewards.new(ac.address, forwarder.address, token.address, verifierAddress);
    console.log(`New WellnessRewards deployed at: ${wellnessInstance.address}`);

    // Seed pool
    const seedAmount = web3.utils.toWei("50000", "ether");
    await token.transfer(wellnessInstance.address, seedAmount);
    console.log(`Seeded with 50,000 SANJ.`);

    // Sync files
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts', 'WellnessRewards.json');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts', 'WellnessRewards.json');
    const serverConfigPath = path.join(__dirname, '..', '..', 'server', 'config', 'WellnessRewards.json'); // Just in case
    
    const contractData = {
        abi: WellnessRewards.abi,
        networks: {
            [networkId]: {
                address: wellnessInstance.address
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
