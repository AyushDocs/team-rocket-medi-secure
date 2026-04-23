module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== TEST: Direct AccessControl ===");
        
        const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
        const Patient = artifacts.require("Patient");
        
        const ac = await MediSecureAccessControl.deployed();
        const patient = await Patient.deployed();
        
        // Get the underlying role hashes
        const ADMIN_ROLE = await ac.ADMIN_ROLE();
        const PATIENT_ROLE = await ac.PATIENT_ROLE();
        
        console.log("ADMIN_ROLE:", ADMIN_ROLE);
        console.log("PATIENT_ROLE:", PATIENT_ROLE);
        
        // Try using the underlying AccessControl.grantRole directly
        // This should use the inherited function from OZ
        console.log("\nTrying grantRole(ADMIN_ROLE, patient)...");
        try {
            await ac.methods['grantRole(bytes32,address)'](ADMIN_ROLE, patient.address, { from: accounts[0], gas: 200000 });
            console.log("SUCCESS!");
        } catch(e) {
            console.log("FAILED:", e.message.slice(0,80));
        }
        
        // Check if it worked
        const hasAdmin = await ac.methods['hasRole(bytes32,address)'](ADMIN_ROLE, patient.address);
        console.log("Patient has ADMIN role:", hasAdmin);
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};