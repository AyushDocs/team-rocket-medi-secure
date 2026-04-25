const Hospital = artifacts.require("Hospital");
const Doctor = artifacts.require("Doctor");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const path = require('path');
const fs = require('fs');

module.exports = async function (deployer) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  // Deploy Hospital
  await deployer.deploy(Hospital, ac.address, forwarder.address);
  const hospitalInstance = await Hospital.deployed();

  // Authorize managers in Access Control
  await ac.setAuthorizedManager(hospitalInstance.address, true);
  console.log(`Hospital at ${hospitalInstance.address} authorized as manager in AC.`);
  
  const doctorInstance = await Doctor.deployed();
  await ac.setAuthorizedManager(doctorInstance.address, true);
  console.log(`Doctor at ${doctorInstance.address} authorized as manager in AC.`);

  const currentAdmin = (await web3.eth.getAccounts())[0];
  console.log(`Current Deployer/Admin: ${currentAdmin}`);
  console.log(`Doctor's AC: ${await doctorInstance.accessControl()}`);
  console.log(`Actual AC: ${ac.address}`);

  // Update Doctor contract with Hospital address
  try {
     await doctorInstance.setHospitalContract(hospitalInstance.address, { from: currentAdmin });
     console.log(`Doctor contract updated with Hospital address: ${hospitalInstance.address}`);
  } catch (err) {
      console.error("Failed to link Hospital to Doctor (Check ownership):", err.message);
  }

  // Save Artifact to Frontend and Server
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, "../../frontend/contracts");
  const serverPath = path.join(__dirname, "../../server/contracts");
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contractData = Hospital.toJSON();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      address: hospitalInstance.address,
      transactionHash: hospitalInstance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'Hospital.json'), JSON.stringify(contractData, null, 2));
  fs.writeFileSync(path.join(serverPath, 'Hospital.json'), JSON.stringify(contractData, null, 2));
  console.log(`Hospital synced to frontend and server.`);
};
