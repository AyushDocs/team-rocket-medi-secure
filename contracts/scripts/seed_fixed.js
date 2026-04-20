const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== FIXED SEED SCRIPT ===");
        
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();
        const forwarder = await SanjeevniMockForwarder.deployed();
        
        console.log("Contracts loaded");
        
        // Try to set accessControl on Doctor and Hospital if not set
        console.log("\nChecking Doctor accessControl...");
        try {
            await doctor.setAccessControl(ac.address, { from: accounts[0], gas: 100000 });
            console.log("Doctor accessControl set");
        } catch(e) {
            // May fail if already set or no such function
        }
        
        console.log("Checking Hospital accessControl...");
        try {
            await hospital.setAccessControl(ac.address, { from: accounts[0], gas: 100000 });
            console.log("Hospital accessControl set");
        } catch(e) {
            // May fail if already set or no such function
        }
        
        // Grant roles directly via AccessControl before registration
        console.log("\nGranting roles to seed accounts...");
        
        // Patient: accounts[1]
        try {
            await ac.grantRole(3, accounts[1], { from: accounts[0], gas: 100000 }); // 3 = PATIENT
            console.log("PATIENT role granted to accounts[1]");
        } catch(e) {
            console.log("Grant patient role error:", e.message.slice(0,50));
        }
        
        // Doctor: accounts[4]
        try {
            await ac.grantRole(1, accounts[4], { from: accounts[0], gas: 100000 }); // 1 = DOCTOR
            console.log("DOCTOR role granted to accounts[4]");
        } catch(e) {
            console.log("Grant doctor role error:", e.message.slice(0,50));
        }
        
        // Hospital: accounts[9]
        try {
            await ac.grantRole(4, accounts[9], { from: accounts[0], gas: 100000 }); // 4 = HOSPITAL
            console.log("HOSPITAL role granted to accounts[9]");
        } catch(e) {
            console.log("Grant hospital role error:", e.message.slice(0,50));
        }
        
        // Company: accounts[6]
        try {
            await ac.grantRole(6, accounts[6], { from: accounts[0], gas: 100000 }); // 6 = MARKETPLACE_COMPANY
            console.log("MARKETPLACE_COMPANY role granted to accounts[6]");
        } catch(e) {
            console.log("Grant company role error:", e.message.slice(0,50));
        }
        
        // Insurance: accounts[8]
        try {
            await ac.grantRole(5, accounts[8], { from: accounts[0], gas: 100000 }); // 5 = INSURANCE_PROVIDER
            console.log("INSURANCE_PROVIDER role granted to accounts[8]");
        } catch(e) {
            console.log("Grant insurance role error:", e.message.slice(0,50));
        }
        
        // Now try registering
        console.log("\n=== Registering Entities ===");
        
        // Patient
        console.log("\n1. Registering patient...");
        try {
            await patient.registerPatient("patient1", "Patient One", "patient1@test.com", 30, "O+", { from: accounts[1], gas: 300000 });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,80));
        }
        
        // Doctor
        console.log("\n2. Registering doctor...");
        try {
            await doctor.registerDoctor("Dr. Strange", "Neurology", "Sanctum Medical", { from: accounts[4], gas: 300000 });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,80));
        }
        
        // Hospital
        console.log("\n3. Registering hospital...");
        try {
            await hospital.registerHospital("Community Health", "contact@community.com", "LA", "REG456", { from: accounts[9], gas: 300000 });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,80));
        }
        
        // Company
        console.log("\n4. Registering company...");
        try {
            await marketplace.registerCompany("Pfizer Research", "info@pfizer.com", { from: accounts[6], gas: 300000 });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,80));
        }
        
        // Insurance
        console.log("\n5. Registering insurance...");
        try {
            await insurance.registerInsuranceProvider("SafeLife Insurance", { from: accounts[8], gas: 300000 });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message.slice(0,80));
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};