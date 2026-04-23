const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");

module.exports = async function(callback) {
    try {
        const forwarder = await SanjeevniMockForwarder.deployed();
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();

        console.log("\n=== CHECK TRUSTED FORWARDER ===");
        console.log("Forwarder address:", forwarder.address);
        
        console.log("\nPatient trustedForwarder:", await patient.trustedForwarder());
        console.log("Doctor trustedForwarder:", await doctor.trustedForwarder());
        console.log("Hospital trustedForwarder:", await hospital.trustedForwarder());
        
        // Check if forwarder isTrusted
        console.log("\nForwarder isTrusted:", await forwarder.isTrustedForwarder(patient.address));
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};