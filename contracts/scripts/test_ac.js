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

        console.log("\n=== CHECK ACCESS CONTROL IN CONTRACTS ===");
        
        console.log("\n1. Patient accessControl address:");
        console.log("   Expected:", ac.address);
        try {
            const patientAC = await patient.accessControl();
            console.log("   Actual:", patientAC);
        } catch(e) {
            console.log("   Error:", e.message);
        }

        console.log("\n2. Doctor accessControl address:");
        console.log("   Expected:", ac.address);
        try {
            const doctorAC = await doctor.accessControl();
            console.log("   Actual:", doctorAC);
        } catch(e) {
            console.log("   Error:", e.message);
        }
        
        console.log("\n3. Hospital accessControl address:");
        console.log("   Expected:", ac.address);
        try {
            const hospitalAC = await hospital.accessControl();
            console.log("   Actual:", hospitalAC);
        } catch(e) {
            console.log("   Error:", e.message);
        }

        console.log("\n4. Marketplace accessControl address:");
        console.log("   Expected:", ac.address);
        try {
            const marketplaceAC = await marketplace.accessControl();
            console.log("   Actual:", marketplaceAC);
        } catch(e) {
            console.log("   Error:", e.message);
        }

        console.log("\n5. Insurance accessControl address:");
        console.log("   Expected:", ac.address);
        try {
            const insuranceAC = await insurance.accessControl();
            console.log("   Actual:", insuranceAC);
        } catch(e) {
            console.log("   Error:", e.message);
        }
        
        console.log("\n=== ATTEMPTING CALL FROM ADMIN (account 0) ===");
        
        // Try registering from admin account (should work)
        try {
            const tx = await patient.registerPatient(
                "admin_patient", 
                "Admin Patient", 
                "admin@test.com", 
                25, 
                "A+", 
                { from: accounts[0], gas: 300000 }
            );
            console.log("Patient from admin: SUCCESS!");
        } catch(e) {
            console.log("Patient from admin: FAILED -", e.message);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};