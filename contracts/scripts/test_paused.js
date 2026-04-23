const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");

module.exports = async function(callback) {
    try {
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();

        console.log("\n=== CHECK PAUSABLE STATE ===");
        
        console.log("Patient.paused():", await patient.paused());
        console.log("Doctor.paused():", await doctor.paused());
        console.log("Hospital.paused():", await hospital.paused());
        console.log("Marketplace.paused():", await marketplace.paused());
        console.log("Insurance.paused():", await insurance.paused());
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};