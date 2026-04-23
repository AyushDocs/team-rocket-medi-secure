const Patient = artifacts.require("Patient");
const ConsentSBT = artifacts.require("ConsentSBT");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function(callback) {
  try {
    const ac = await MediSecureAccessControl.deployed();
    const forwarder = await SanjeevniMockForwarder.deployed();
    const sbt = await ConsentSBT.deployed();
    
    console.log("Re-deploying Patient...");
    const patientInstance = await Patient.new(forwarder.address, { gas: 6000000 });
    await patientInstance.initialize(ac.address, sbt.address);
    
    console.log("Authorizing Patient in AccessControl...");
    // Patient needs proper roles or authorization
    await ac.setAuthorizedManager(patientInstance.address, true);
    
    console.log(`New Patient deployed and authorized at: ${patientInstance.address}`);

    // Sync files
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts', 'Patient.json');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts', 'Patient.json');
    
    const contractData = {
        abi: Patient.abi,
        networks: {
            [networkId]: {
                address: patientInstance.address
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
