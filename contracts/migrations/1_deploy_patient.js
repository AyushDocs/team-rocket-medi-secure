const Patient = artifacts.require("Patient");
const fs=require('fs')
const path=require('path')
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Patient);
  const patientInstance = await Patient.deployed();

  const contractPath=path.join(__dirname,'..','build','contracts','Patient.json')
  const contractData=JSON.parse(fs.readFileSync(contractPath))
  const frontendPath=path.join(__dirname,'..','..','frontend','contracts')
  fs.writeFileSync(path.join(frontendPath,'Patient.json'),JSON.stringify(contractData))
  console.log("Patient contract deployed at:", patientInstance.address);

};