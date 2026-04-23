module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== FINAL DEBUG: Contract State Check ===");
        
        const Patient = artifacts.require("Patient");
        const Doctor = artifacts.require("Doctor");
        const Hospital = artifacts.require("Hospital");
        const Marketplace = artifacts.require("Marketplace");
        const Insurance = artifacts.require("Insurance");
        const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
        const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");
        
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();
        const forwarder = await SanjeevniMockForwarder.deployed();
        
        console.log("\n=== Contracts Addresses ===");
        console.log("AccessControl:", ac.address);
        console.log("Forwarder:", forwarder.address);
        console.log("Patient:", patient.address);
        console.log("Doctor:", doctor.address);
        console.log("Hospital:", hospital.address);
        console.log("Marketplace:", marketplace.address);
        console.log("Insurance:", insurance.address);
        
        console.log("\n=== Contract Config Check ===");
        
        // Patient config
        console.log("\nPatient:");
        const patientAC = await patient.accessControl.call();
        const patientForwarder = await patient.trustedForwarder.call();
        console.log("  accessControl:", patientAC);
        console.log("  forwarder:", patientForwarder);
        console.log("  AC matches?:", patientAC === ac.address);
        
        // Doctor config  
        console.log("\nDoctor:");
        try {
            const doctorAC = await doctor.accessControl.call();
            console.log("  accessControl:", doctorAC);
        } catch(e) {
            console.log("  accessControl: ERROR -", e.message.slice(0,30));
        }
        
        // Hospital config
        console.log("\nHospital:");
        try {
            const hospitalAC = await hospital.accessControl.call();
            console.log("  accessControl:", hospitalAC);
        } catch(e) {
            console.log("  accessControl: ERROR -", e.message.slice(0,30));
        }
        
        // Try direct AC role grants (without going through contract)
        console.log("\n=== Direct Role Grant Test ===");
        
        console.log("Granting PATIENT role to accounts[1] directly...");
        try {
            await ac.grantRole(web3.utils.keccak256("PATIENT_ROLE"), accounts[1], { from: accounts[0], gas: 200000 });
            console.log("SUCCESS!");
        } catch(e) {
            console.log("FAILED:", e.message.slice(0,50));
        }
        
        console.log("\nChecking if accounts[1] has PATIENT role...");
        const hasPatient = await ac.hasRole(web3.utils.keccak256("PATIENT_ROLE"), accounts[1]);
        console.log("Has PATIENT role:", hasPatient);
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};