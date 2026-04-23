const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();

        console.log("\n=== TESTING TRANSACTIONS ===");
        
        // Test Patient registration
        console.log("\n1. Testing Patient.registerPatient...");
        try {
            const tx = await patient.registerPatient(
                "patient1", 
                "Patient One", 
                "patient1@test.com", 
                30, 
                "O+", 
                { from: accounts[1], gas: 200000 }
            );
            console.log("  SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("  FAILED:", e.message);
            console.log("  Full error:", e);
        }

        // Test Doctor registration
        console.log("\n2. Testing Doctor.registerDoctor...");
        try {
            const tx = await doctor.registerDoctor(
                "Dr. Strange", 
                "Neurology", 
                "Sanctum Medical", 
                { from: accounts[4], gas: 200000 }
            );
            console.log("  SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("  FAILED:", e.message);
        }

        // Test Hospital registration
        console.log("\n3. Testing Hospital.registerHospital...");
        try {
            const tx = await hospital.registerHospital(
                "Community Health", 
                "contact@community.com", 
                "LA", 
                "REG456", 
                { from: accounts[9], gas: 200000 }
            );
            console.log("  SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("  FAILED:", e.message);
        }

        // Test Marketplace registration
        console.log("\n4. Testing Marketplace.registerCompany...");
        try {
            const tx = await marketplace.registerCompany(
                "Pfizer Research", 
                "info@pfizer.com", 
                { from: accounts[6], gas: 200000 }
            );
            console.log("  SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("  FAILED:", e.message);
        }

        // Test Insurance registration
        console.log("\n5. Testing Insurance.registerInsuranceProvider...");
        try {
            const tx = await insurance.registerInsuranceProvider(
                "SafeLife Insurance", 
                { from: accounts[8], gas: 200000 }
            );
            console.log("  SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("  FAILED:", e.message);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};