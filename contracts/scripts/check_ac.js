const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
  try {
    console.log("\n=== CHECKING ACCESS CONTROL STATUS ===\n");

    const ac = await MediSecureAccessControl.deployed();
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    console.log("Deployer:", deployer);
    console.log("AC Address:", ac.address);

    // Try different approach - check via OpenZeppelin's direct role storage
    // The role admin is stored at _roleRole[role] and members at _roleMembers[role]
    
    // ADMIN_ROLE is 0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775
    // In OpenZeppelin AccessControl, role members are stored in a mapping
    
    // Let's just check if contract is paused - simple read-only call
    try {
      const paused = await ac.paused();
      console.log("Contract paused:", paused);
    } catch(e) {
      console.log("Paused check failed:", e.message.slice(0,50));
    }

    // Check authorized managers mapping
    const isManager = await ac.authorizedManagers(deployer);
    console.log("Deployer is authorized manager:", isManager);

    // Try to call setAuthorizedManager to make deployer a manager
    console.log("\n=== ADDING DEPLOYER AS AUTHORIZED MANAGER ===");
    try {
      await ac.setAuthorizedManager(deployer, true);
      console.log("SUCCESS: Deployer added as manager");
    } catch(e) {
      console.log("ERROR:", e.message.slice(0,60));
    }

    // Now check if deployer is a manager
    const isManagerNow = await ac.authorizedManagers(deployer);
    console.log("Deployer is now authorized manager:", isManagerNow);

    console.log("\n=== COMPLETE ===\n");
    callback();
  } catch (error) {
    console.log("\n!!! ERROR !!!");
    console.log(error.message);
    callback(error);
  }
};