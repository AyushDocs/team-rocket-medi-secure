const Marketplace = artifacts.require("Marketplace");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const path = require('path');
const fs = require('fs');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const token = await SanjeevniToken.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();

  await deployer.deploy(Marketplace, forwarder.address);
  const instance = await Marketplace.deployed();
  await instance.initialize(ac.address, token.address);

  console.log(`Marketplace deployed at: ${instance.address}`);
  
  // Authorize Marketplace in Access Control
  await ac.setAuthorizedManager(instance.address, true);
  
  const networkId = await web3.eth.net.getId();
  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  
  [frontendPath, serverPath].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const contractData = Marketplace.toJSON();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      address: instance.address,
      transactionHash: instance.transactionHash
  };
  fs.writeFileSync(path.join(frontendPath, 'Marketplace.json'), JSON.stringify(contractData, null, 2));
  fs.writeFileSync(path.join(serverPath, 'Marketplace.json'), JSON.stringify(contractData, null, 2));
  console.log(`Marketplace synced to frontend and server.`);
};
