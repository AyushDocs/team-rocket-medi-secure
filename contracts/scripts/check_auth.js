const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
  try {
    const ac = await MediSecureAccessControl.deployed();
    const patient = await Patient.deployed();
    
    console.log("Checking authorization for Patient contract at:", patient.address);
    console.log("AccessControl contract at:", ac.address);
    
    const isAuthorized = await ac.authorizedManagers(patient.address);
    const isAdmin = await ac.hasRole(await ac.ADMIN_ROLE(), patient.address);
    
    console.log("Is Authorized Manager:", isAuthorized);
    console.log("Has Admin Role:", isAdmin);
    
    if (!isAuthorized && !isAdmin) {
      console.log("\n[WARNING] Patient contract is NOT authorized to grant roles!");
      console.log("Attempting to authorize now...");
      
      const accounts = await web3.eth.getAccounts();
      await ac.setAuthorizedManager(patient.address, true, { from: accounts[0] });
      
      console.log("Authorization successful!");
    } else {
      console.log("\n[OK] Patient contract is properly authorized.");
    }
    
    callback();
  } catch (error) {
    console.error("Error checking authorization:", error);
    callback(error);
  }
};
