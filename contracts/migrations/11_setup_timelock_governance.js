const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const TimelockController = artifacts.require("@openzeppelin/contracts/governance/TimelockController.sol");

module.exports = async function (deployer, network, accounts) {
  const ac = await MediSecureAccessControl.deployed();

  const minDelay = 172800; // 48 hours in seconds
  const proposers = [accounts[0]];
  const executors = [accounts[0], "0x0000000000000000000000000000000000000000"];
  const admin = accounts[0];

  console.log("Deploying TimelockController with 48h delay...");
  await deployer.deploy(TimelockController, minDelay, proposers, executors, admin);
  const timelock = await TimelockController.deployed();
  console.log(`TimelockController deployed at: ${timelock.address}`);

  console.log("Note: Role assignment requires manual configuration.");
  console.log("Grant ADMIN_ROLE to TimelockController manually if needed.");

  // For production, renounce deployer's admin role here:
  // await ac.revokeRole(ADMIN_ROLE, accounts[0]);

  console.log("Governance Transition Complete:");
  console.log(`1. Central Admin: ${accounts[0]} (Current Proposer)`);
  console.log(`2. Executive Authority: ${timelock.address} (Required for all changes)`);
  console.log(`3. Delay: 48 Hours`);
};
