const Doctor = artifacts.require("Doctor");
const fs=require('fs')
const path=require('path')
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Doctor);
  const doctorInstance = await Doctor.deployed();

  const contractPath=path.join(__dirname,'..','build','contracts','Doctor.json')
  const contractData=JSON.parse(fs.readFileSync(contractPath))
  const frontendPath=path.join(__dirname,'..','..','frontend','contracts')
  fs.writeFileSync(path.join(frontendPath,'Doctor.json'),JSON.stringify(contractData))
  console.log("Doctor contract deployed at:", doctorInstance.address);
};
