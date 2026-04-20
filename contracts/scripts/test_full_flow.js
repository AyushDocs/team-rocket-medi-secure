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

        console.log("Deployer (accounts[0]):", accounts[0]);
        
        // Check using the enum-based hasRole
        const isAdmin = await ac.hasRole(0, accounts[0]);
        console.log("accounts[0] is ADMIN:", isAdmin);
        
        // Let's try granting role from deployer
        console.log("\nTrying to grant PATIENT role to accounts[1] from accounts[0]...");
        try {
            const tx = await ac.grantPatientRole(accounts[1], { from: accounts[0], gas: 200000 });
            console.log("SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("FAILED:", e.message);
        }
        
        // Now try to register patient
        console.log("\nTrying to register patient from accounts[1]...");
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