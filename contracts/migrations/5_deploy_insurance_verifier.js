const Insurance = artifacts.require("Insurance");
const InsuranceVerifier = artifacts.require("InsuranceVerifier");
const InsurancePriceOracle = artifacts.require("InsurancePriceOracle");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const PriceMedianizer = artifacts.require("PriceMedianizer");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  const token = await SanjeevniToken.deployed();

  // 1. Deploy Medianizer
  await deployer.deploy(PriceMedianizer, accounts[0]);
  const medianizer = await PriceMedianizer.deployed();
  
  // 2. Deploy Mock Chainlink Aggregator
  const MockAggregator = artifacts.require("MockChainlinkAggregator");
  await deployer.deploy(MockAggregator, 300000000000, 8); // $3000 with 8 decimals
  const mockFeed = await MockAggregator.deployed();
  
  await medianizer.addOracle(mockFeed.address, true);
  console.log(`Mock Price Feed deployed and added to Medianizer at ${mockFeed.address}`);


  // 3. Deploy Oracle pointing to Medianizer
  await deployer.deploy(InsurancePriceOracle, ac.address, forwarder.address, medianizer.address);

  
  // 4. Deploy Insurance via Proxy
  // VRF coordinator: use a non-zero stub for local dev (Chainlink reverts on address(0))
  const vrfCoordinator = "0x0000000000000000000000000000000000000001";
  const subId = 0;
  const keyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  await deployer.deploy(Insurance, forwarder.address, vrfCoordinator);
  const insuranceInstance = await Insurance.deployed();
  await insuranceInstance.initialize(ac.address, token.address, subId, keyHash, 100000);

  console.log(`Insurance deployed at: ${insuranceInstance.address}`);

  // Authorize Insurance
  await ac.setAuthorizedManager(insuranceInstance.address, true);

  // Deploy Verifier (stored separately; zkpVerifier set via admin tx when needed)
  await deployer.deploy(InsuranceVerifier);
  const verifierInstance = await InsuranceVerifier.deployed();
  console.log(`InsuranceVerifier deployed at: ${verifierInstance.address}`);

  // Save Artifacts for Frontend and Server
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contracts = [
      { artifact: Insurance, instance: insuranceInstance, name: 'Insurance' },
      { artifact: InsuranceVerifier, instance: verifierInstance, name: 'InsuranceVerifier' },
      { artifact: InsurancePriceOracle, instance: await InsurancePriceOracle.deployed(), name: 'InsurancePriceOracle' },
      { artifact: PriceMedianizer, instance: medianizer, name: 'PriceMedianizer' }
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
