const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();

        console.log("=== ALTERNATIVE REGISTRATION TEST ===");
        
        // The issue might be the whenNotPaused modifier from PausableUpgradeable
        // Let's try using the upgradeable version of Patient (PatientUpgradeable)
        // which might be different
        
        // Actually let's check: does the Patient contract's registerPatient have onlyRoleName?
        // Looking at the code - NO! It only has whenNotPaused
        
        // The issue must be with PausableUpgradeable's internal paused state
        // Let's check if Patient is paused via the upgradeable version
        console.log("Patient.paused():", await patient.paused());
        
        // Let's try to unpause if paused
        if (await patient.paused()) {
            console.log("Unpausing Patient...");
            await patient.unpause({ from: accounts[0] });
        }
        
        // Try registering again
        console.log("\nAttempting to register patient from accounts[1]...");
        try {
            const tx = await patient.registerPatient(
                "patient1", 
                "Patient One", 
                "patient1@test.com", 
                30, 
                "O+", 
                { from: accounts[1], gas: 300000 }
            );
            console.log("SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("FAILED:", e.message);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};