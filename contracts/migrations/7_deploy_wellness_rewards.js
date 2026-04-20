const WellnessRewards = artifacts.require("WellnessRewards");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const InsuranceVerifier = artifacts.require("InsuranceVerifier");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  const token = await SanjeevniToken.deployed();
  
  // Use real verifier if deployed, otherwise address(0) for testing
  let verifierAddress = "0x0000000000000000000000000000000000000000";
  try {
     const verifier = await InsuranceVerifier.deployed();
     verifierAddress = verifier.address;
  } catch(e) {
     console.log("InsuranceVerifier not found, using dummy verifier address.");
  }

  await deployer.deploy(WellnessRewards, ac.address, forwarder.address, token.address, verifierAddress);
  const wellnessInstance = await WellnessRewards.deployed();
  console.log(`WellnessRewards deployed at: ${wellnessInstance.address}`);

  // Seed the rewards pool with 50,000 SANJ for initial testing
  const seedAmount = web3.utils.toWei("50000", "ether");
  await token.transfer(wellnessInstance.address, seedAmount);
  console.log(`Seeded WellnessRewards with ${seedAmount} SANJ.`);

  // Save Artifacts to Frontend and Server
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contractData = WellnessRewards.toJSON();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      address: wellnessInstance.address,
      transactionHash: wellnessInstance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'WellnessRewards.json'), JSON.stringify(contractData, null, 2));
  fs.writeFileSync(path.join(serverPath, 'WellnessRewards.json'), JSON.stringify(contractData, null, 2));
  console.log(`WellnessRewards synced to frontend and server.`);
};
