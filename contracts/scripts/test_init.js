const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
    try {
        const patient = await Patient.deployed();
        
        console.log("\n=== Checking Patient initialization ===");
        console.log("Patient address:", patient.address);
        
        // Try calling a view function that requires initialization
        try {
            const count = await patient.patientCount();
            console.log("patientCount:", count.toString());
        } catch(e) {
            console.log("patientCount error:", e.message);
        }
        
        // Check if initialized by trying to call initialize again (will fail if already initialized)
        console.log("\nChecking if contract is properly initialized...");
        try {
            // This should fail if already initialized (initializer modifier)
            // But if not initialized, it would succeed
            // Since we can't call it without args, let's try another way
        } catch(e) {}
        
        // Check consentSBT address
        try {
            const sbt = await patient.consentSBT();
            console.log("consentSBT address:", sbt);
        } catch(e) {
            console.log("consentSBT error:", e.message);
        }
        
        // Check accessControl address
        try {
            const ac = await patient.accessControl();
            console.log("accessControl address:", ac);
        } catch(e) {
            console.log("accessControl error:", e.message);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};