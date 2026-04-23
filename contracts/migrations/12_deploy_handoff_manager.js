const HandoffManager = artifacts.require("HandoffManager");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const fs = require('fs');
const path = require('path');

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();
  
  await deployer.deploy(HandoffManager, ac.address, forwarder.address);
  const instance = await HandoffManager.deployed();
  
  console.log(`HandoffManager deployed at: ${instance.address}`);

  const contractData = HandoffManager.toJSON();
  const networkId = await web3.eth.net.getId();
  if (!contractData.networks) contractData.networks = {};
  contractData.networks[networkId] = {
      events: {},
      links: {},
      address: instance.address,
      transactionHash: instance.transactionHash
  };

  const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
  if (!fs.existsSync(frontendPath)){
      fs.mkdirSync(frontendPath, { recursive: true });
  }
  fs.writeFileSync(path.join(frontendPath, 'HandoffManager.json'), JSON.stringify(contractData, null, 2));
  
  const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
  if (!fs.existsSync(serverPath)){
      fs.mkdirSync(serverPath, { recursive: true });
  }
  fs.writeFileSync(path.join(serverPath, 'HandoffManager.json'), JSON.stringify(contractData, null, 2));
  
  console.log(`HandoffManager artifact synced to frontend and server.`);
};
