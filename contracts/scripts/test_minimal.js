const Patient = artifacts.require("Patient");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== MINIMAL TEST: Patient Contract ===");
        
        const patient = await Patient.deployed();
        const ac = await MediSecureAccessControl.deployed();
        
        console.log("Patient address:", patient.address);
        
        // Test 1: Simple view function (no auth)
        console.log("\n1. Testing view function (patientCount)...");
        const count = await patient.patientCount();
        console.log("   Result:", count.toString());
        
        // Test 2: Try to register from account[0] which is admin
        console.log("\n2. Testing registerPatient from admin (account[0])...");
        try {
            const tx = await patient.registerPatient(
                "adminuser1",
                "Admin User",
                "admin@test.com",
                30,
                "A+",
                { from: accounts[0], gas: 500000 }
            );
            console.log("   SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,100));
        }
        
        // Test 3: Check if admin has PATIENT role now
        const hasRole = await ac.hasRole(3, accounts[0]);
        console.log("\n3. Account[0] has PATIENT role:", hasRole);
        
        // Test 4: Register from patient again (should fail - already registered)
        console.log("\n4. Testing registerPatient from same account again...");
        try {
            const tx = await patient.registerPatient(
                "adminuser2",
                "Admin User 2",
                "admin2@test.com",
                25,
                "B+",
                { from: accounts[0], gas: 500000 }
            );
            console.log("   SUCCESS (unexpected!)");
        } catch(e) {
            console.log("   Expected failure:", e.message.slice(0,50));
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};