const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
const RBACDoctor = artifacts.require("RBACDoctor");

module.exports = async function (deployer) {
  const accessControl = await MediSecureAccessControl.deployed();
  const forwarder = await SanjeevniMockForwarder.deployed();

  await deployer.deploy(RBACDoctor, accessControl.address, forwarder.address);
  const rbacDoctor = await RBACDoctor.deployed();
  console.log(`RBACDoctor deployed at: ${rbacDoctor.address}`);
};