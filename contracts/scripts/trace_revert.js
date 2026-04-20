const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();

        console.log("\n=== TRACING REVERT SOURCE ===");
        
        // The error is in MediSecureAuthUpgradeable.onlyRoleName
        // which checks: accessControl.hasRole(role, _msgSender())
        
        // Let's trace through by calling view functions
        
        // 1. Check accessControl.paused()
        console.log("1. AC.paused():", await ac.paused());
        
        // 2. Check if account[1] has PATIENT role (should be false)
        const hasPatientRole = await ac.hasRole(3, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
        console.log("2. accounts[1] has PATIENT role:", hasPatientRole);
        
        // 3. Check if account[1] has any role
        const adminRole = await ac.ADMIN_ROLE();
        const hasAdminRole = await ac.hasRole(adminRole, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
        console.log("3. accounts[1] has ADMIN role:", hasAdminRole);
        
        // 4. Try calling a non-View function that doesn't check roles
        // Like: addMedicalRecord (requires PATIENT role)
        // Or try to call registerPatient but without passing whenNotPaused
        
        // Let's try to manually trace what's happening by calling via call (not tx)
        console.log("\n4. Testing via .call()...");
        try {
            const result = await patient.registerPatient.call(
                "testuser", 
                "Test User", 
                "test@test.com", 
                25, 
                "A+", 
                { from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' }
            );
            console.log("Call result:", result);
        } catch(e) {
            console.log("Call error:", e.message.slice(0, 200));
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};