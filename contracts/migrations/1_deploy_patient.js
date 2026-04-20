const Patient = artifacts.require("Patient");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  
  const ConsentSBT = artifacts.require("ConsentSBT");
  
  // 1. Deploy ConsentSBT
  await deployer.deploy(ConsentSBT, accounts[0]);
  const sbtInstance = await ConsentSBT.deployed();
  console.log(`ConsentSBT deployed at: ${sbtInstance.address}`);

  // 2. Deploy Patient with SBT address
  await deployer.deploy(Patient, forwarder.address);
  const patientInstance = await Patient.deployed();
  
  // Initialize the proxy-ready contract manually as a singleton
  await patientInstance.initialize(ac.address, sbtInstance.address);
  
  // Authorize Patient in Access Control
  await ac.setAuthorizedManager(patientInstance.address, true);

  // 3. Transfer ConsentSBT ownership to Patient contract so it can mint
  await sbtInstance.transferOwnership(patientInstance.address);
  console.log("ConsentSBT ownership transferred to Patient contract.");
  
  // Note: grantAdminRole is called in seed script, not here, to work around deployment issues

  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contracts = [
      { artifact: Patient, instance: patientInstance, name: 'Patient' },
      { artifact: ConsentSBT, instance: sbtInstance, name: 'ConsentSBT' }
  ];

  for (const { artifact, instance, name } of contracts) {
      const data = artifact.toJSON();
      if (!data.networks) data.networks = {};
      data.networks[networkId] = {
          address: instance.address,
          transactionHash: instance.transactionHash
      };
      fs.writeFileSync(path.join(frontendPath, `${name}.json`), JSON.stringify(data, null, 2));
      fs.writeFileSync(path.join(serverPath, `${name}.json`), JSON.stringify(data, null, 2));
      console.log(`${name} synced to frontend and server.`);
  }
};