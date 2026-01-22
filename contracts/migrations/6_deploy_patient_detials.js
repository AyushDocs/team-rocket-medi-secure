const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const PatientDetails = artifacts.require("PatientDetails");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const instance = await deployProxy(PatientDetails, [accounts[0]], { deployer, kind: 'uups' });
  console.log("PatientDetails Proxy deployed at:", instance.address);

  console.log("PatientDetails Proxy deployed at:", instance.address);

  const buildPath = path.join(__dirname, '..', 'build', 'contracts', 'PatientDetails.json');
  const contractData = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
  const networkId = await web3.eth.net.getId();
  
  console.log("Adding network info for Network ID:", networkId);
  if (!contractData.networks) contractData.networks = {};
  
  contractData.networks[networkId] = {
      events: {},
      links: {},
      address: instance.address,
      transactionHash: instance.transactionHash
  };

  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  console.log("Writing artifact to:", frontendPath);
  if (!fs.existsSync(frontendPath)){
      fs.mkdirSync(frontendPath, { recursive: true });
  }
  const targetFile = path.join(frontendPath, 'PatientDetailsProxy.json');
  fs.writeFileSync(targetFile, JSON.stringify(contractData, null, 2));
  console.log("Artifact written successfully to:", targetFile);
};