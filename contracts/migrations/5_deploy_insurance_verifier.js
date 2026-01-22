const Insurance = artifacts.require("Insurance");
const InsuranceVerifier = artifacts.require("InsuranceVerifier");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer) {
  // 1. Deploy Insurance Contract
  await deployer.deploy(Insurance);
  const insuranceInstance = await Insurance.deployed();
  console.log("Insurance contract deployed at:", insuranceInstance.address);

  // 2. Deploy Real Verifier
  await deployer.deploy(InsuranceVerifier);
  const verifierInstance = await InsuranceVerifier.deployed();
  console.log("InsuranceVerifier deployed at:", verifierInstance.address);

  // 3. Link Verifier to Insurance
  await insuranceInstance.setVerifier(verifierInstance.address);
  console.log("Insurance contract updated with real ZKP Verifier address.");

  // 4. Save Artifacts to Frontend
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  
  if (!fs.existsSync(frontendPath)){
      fs.mkdirSync(frontendPath, { recursive: true });
  }

  // Save Insurance Artifact
  const insuranceData = Insurance.toJSON();
  if (!insuranceData.networks) insuranceData.networks = {};
  insuranceData.networks[networkId] = {
      address: insuranceInstance.address,
      transactionHash: insuranceInstance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'Insurance.json'), JSON.stringify(insuranceData, null, 2));

  // Save Real Verifier Artifact
  const verifierData = InsuranceVerifier.toJSON();
  if (!verifierData.networks) verifierData.networks = {};
  verifierData.networks[networkId] = {
      address: verifierInstance.address,
      transactionHash: verifierInstance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'InsuranceVerifier.json'), JSON.stringify(verifierData, null, 2));

  console.log("Insurance and Real Verifier artifacts saved to frontend.");
};
