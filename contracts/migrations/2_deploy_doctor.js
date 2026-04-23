const Doctor = artifacts.require("Doctor");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  await deployer.deploy(Doctor, ac.address, forwarder.address);
  const doctorInstance = await Doctor.deployed();
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contractData = Doctor.toJSON();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      address: doctorInstance.address,
      transactionHash: doctorInstance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'Doctor.json'), JSON.stringify(contractData, null, 2));
  fs.writeFileSync(path.join(serverPath, 'Doctor.json'), JSON.stringify(contractData, null, 2));
  console.log(`Doctor contract deployed at: ${doctorInstance.address} and synced to frontend/server.`);
};
