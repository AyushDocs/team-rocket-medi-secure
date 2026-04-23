const MediSecureTimelock = artifacts.require("MediSecureTimelock");
const GovernanceManager = artifacts.require("GovernanceManager");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const MultiSigWallet = artifacts.require("MultiSigWallet");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");

module.exports = async function (deployer, network, accounts) {
  console.log('\n=== Governance Deployment ===\n');

  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();

  // Read MultiSig deployed by migration 9
  const multiSig = await MultiSigWallet.deployed();
  const multiSigAddress = multiSig.address;
  console.log(`Using MultiSigWallet at: ${multiSigAddress}`);

  // 1. Deploy Timelock (48h delay)
  const minDelay = 172800; // 48 hours
  const proposers = [multiSigAddress];
  const executors = ["0x0000000000000000000000000000000000000000"]; // Open execution
  await deployer.deploy(MediSecureTimelock, minDelay, proposers, executors, accounts[0]);
  const timelock = await MediSecureTimelock.deployed();
  console.log(`MediSecureTimelock deployed at: ${timelock.address}`);

  // 2. Deploy GovernanceManager proxy
  await deployer.deploy(GovernanceManager, forwarder.address);
  const gov = await GovernanceManager.deployed();
  await gov.initialize(multiSigAddress, ac.address);

  console.log(`GovernanceManager deployed at: ${gov.address}`);
  console.log(`GovernanceManager Proxy deployed at: ${gov.address}`);

  // 4. Save Artifacts for Frontend and Server
  const fs = require('fs');
  const path = require('path');
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contracts = [
      { artifact: MediSecureTimelock, instance: timelock, name: 'MediSecureTimelock' },
      { artifact: GovernanceManager, instance: gov, name: 'GovernanceManager' }
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