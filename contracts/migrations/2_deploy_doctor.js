const Doctor = artifacts.require("Doctor");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Doctor);
  const doctorInstance = await Doctor.deployed();

  console.log("Doctor contract deployed at:", doctorInstance.address);
};
