const Doctor = artifacts.require("Doctor");
const fs=require('fs')
const path=require('path')
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Doctor);
  const doctorInstance = await Doctor.deployed();
  const contractData=Doctor.toJSON()
  const networkId = await web3.eth.net.getId();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      events: {},
      links: {},
      address: doctorInstance.address,
      transactionHash: doctorInstance.transactionHash
  };

  const frontendPath=path.join(__dirname,'..','..','frontend','contracts')
  if (!fs.existsSync(frontendPath)){
      fs.mkdirSync(frontendPath, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendPath,'Doctor.json'),JSON.stringify(contractData, null, 2))
  console.log("Doctor contract deployed at:", doctorInstance.address);
};
