const Patient = artifacts.require("Patient");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Patient);
  const patientInstance = await Patient.deployed();

  console.log("Patient contract deployed at:", patientInstance.address);

};