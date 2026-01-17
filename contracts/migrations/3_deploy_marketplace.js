const Marketplace = artifacts.require("Marketplace");
const path = require('path');
const fs = require('fs');

module.exports = async function (deployer) {
  await deployer.deploy(Marketplace);
  const instance = await Marketplace.deployed();
  
  const contractArtifact = Marketplace.toJSON();
  const networkId = await web3.eth.net.getId();
  
  if (!contractArtifact.networks) contractArtifact.networks = {};
  contractArtifact.networks[networkId] = {
      events: {},
      links: {},
      address: instance.address,
      transactionHash: instance.transactionHash
  };

  const frontendPath = path.join(__dirname, "../../frontend/contracts/Marketplace.json");
  fs.writeFileSync(frontendPath, JSON.stringify(contractArtifact, null, 2));
  console.log(`Marketplace ABI + Address written to ${frontendPath}`);
};
