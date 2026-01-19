const Hospital = artifacts.require("Hospital");
const Doctor = artifacts.require("Doctor");
const path = require('path');
const fs = require('fs');

module.exports = async function (deployer) {
  // Deploy Hospital
  await deployer.deploy(Hospital);
  const hospitalInstance = await Hospital.deployed();

  // Update Doctor contract with Hospital address
  const doctorInstance = await Doctor.deployed();
  // We assume the deployer is the owner of Doctor.
  // Check if we can call setHospitalContract
  try {
     await doctorInstance.setHospitalContract(hospitalInstance.address);
     console.log(`Doctor contract updated with Hospital address: ${hospitalInstance.address}`);
  } catch (err) {
      console.error("Failed to link Hospital to Doctor (Check ownership):", err.message);
  }

  // Save Artifact to Frontend
  const contractArtifact = Hospital.toJSON();
  const networkId = await web3.eth.net.getId();
  
  if (!contractArtifact.networks) contractArtifact.networks = {};
  contractArtifact.networks[networkId] = {
      events: {},
      links: {},
      address: hospitalInstance.address,
      transactionHash: hospitalInstance.transactionHash
  };

  const frontendPath = path.join(__dirname, "../../frontend/contracts/Hospital.json");
  // Ensure directory exists
  const dir = path.dirname(frontendPath);
  if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(frontendPath, JSON.stringify(contractArtifact, null, 2));
  console.log(`Hospital ABI + Address written to ${frontendPath}`);
};
