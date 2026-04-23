const PatientDetails = artifacts.require("PatientDetails");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();

  await deployer.deploy(PatientDetails, forwarder.address);
  const instance = await PatientDetails.deployed();
  await instance.initialize(ac.address);

  console.log(`PatientDetails deployed at: ${instance.address}`);

  // Save Artifacts for Frontend and Server
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contractData = PatientDetails.toJSON();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      address: instance.address,
      transactionHash: instance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'PatientDetails.json'), JSON.stringify(contractData, null, 2));
  fs.writeFileSync(path.join(serverPath, 'PatientDetails.json'), JSON.stringify(contractData, null, 2));
  console.log(`PatientDetails synced to frontend and server.`);
};