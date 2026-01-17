const Patient = artifacts.require("Patient");
const fs=require('fs')
const path=require('path')
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Patient);
  const patientInstance = await Patient.deployed();

  const contractData=Patient.toJSON()
  const networkId = await web3.eth.net.getId();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      events: {},
      links: {},
      address: patientInstance.address,
      transactionHash: patientInstance.transactionHash
  };

  const frontendPath=path.join(__dirname,'..','..','frontend','contracts')
  if (!fs.existsSync(frontendPath)){
      fs.mkdirSync(frontendPath, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendPath,'Patient.json'),JSON.stringify(contractData, null, 2))
  console.log("Patient contract deployed at:", patientInstance.address);
};