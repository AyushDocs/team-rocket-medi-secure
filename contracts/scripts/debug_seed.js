const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const ac = await MediSecureAccessControl.deployed();
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();

        console.log("\n=== DEBUG INFO ===");
        console.log("Access Control paused:", await ac.paused());
        console.log("Access Control address:", ac.address);
        
        console.log("\nPatient contract address:", patient.address);
        const patientId1 = await patient.walletToPatientId(accounts[1]);
        console.log("Patient ID for accounts[1]:", patientId1.toString());
        
        console.log("\nDoctor contract address:", doctor.address);
        const doctorId4 = await doctor.walletToDoctorId(accounts[4]);
        console.log("Doctor ID for accounts[4]:", doctorId4.toString());
        
        console.log("\nHospital contract address:", hospital.address);
        const hospitalId9 = await hospital.walletToHospitalId(accounts[9]);
        console.log("Hospital ID for accounts[9]:", hospitalId9.toString());
        
        console.log("\n=== ACCOUNTS ===");
        accounts.slice(0, 10).forEach((acc, i) => console.log(`Account ${i}: ${acc}`));
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};