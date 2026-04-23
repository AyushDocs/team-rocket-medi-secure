const Patient = artifacts.require("Patient");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const patient = await Patient.deployed();
        const ac = await MediSecureAccessControl.deployed();

        console.log("\n=== Using convenience function ===");
        
        // Check if account[0] is admin
        const isAdmin0 = await ac.hasRole(0, accounts[0]);
        console.log("Account[0] is ADMIN:", isAdmin0);
        
        // Grant PATIENT role to account[0] using convenience function
        console.log("\nGranting PATIENT role to accounts[0]...");
        try {
            await ac.grantPatientRole(accounts[0], { from: accounts[0] });
            console.log("Role granted!");
        } catch(e) {
            console.log("Grant failed:", e.message);
        }
        
        // Now try to register
        console.log("\nTrying to register patient...");
        try {
            const tx = await patient.registerPatient(
                "testuser", 
                "Test User", 
                "test@test.com", 
                25, 
                "A+", 
                { from: accounts[0], gas: 500000 }
            );
            console.log("SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("Register failed:", e.message);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};