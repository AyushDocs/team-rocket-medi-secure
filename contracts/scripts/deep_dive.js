const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");
const Marketplace = artifacts.require("Marketplace");
const Insurance = artifacts.require("Insurance");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== DEEP DIVE: Contract State ===");
        
        const patient = await Patient.deployed();
        const doctor = await Doctor.deployed();
        const hospital = await Hospital.deployed();
        const marketplace = await Marketplace.deployed();
        const insurance = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();
        
        // 1. Check AccessControl deployment
        console.log("\n1. AccessControl");
        console.log("   address:", ac.address);
        console.log("   ADMIN_ROLE:", await ac.ADMIN_ROLE());
        console.log("   isAdmin(accounts[0]):", await ac.isAdmin(accounts[0]));
        
        // 2. Check Patient
        console.log("\n2. Patient");
        console.log("   address:", patient.address);
        try {
            console.log("   accessControl:", await patient.accessControl());
        } catch(e) { console.log("   accessControl: ERROR -", e.message.slice(0,50)); }
        
        // 3. Check Doctor - does it have accessControl properly set?
        console.log("\n3. Doctor");
        console.log("   address:", doctor.address);
        try {
            const doctorAC = await doctor.accessControl();
            console.log("   accessControl:", doctorAC);
            // Check if it matches expected
            console.log("   matches AC?:", doctorAC === ac.address);
        } catch(e) { console.log("   accessControl: ERROR -", e.message.slice(0,50)); }
        
        // 4. Try calling a simple view function on Doctor that uses accessControl
        console.log("\n4. Testing Doctor view functions...");
        try {
            const count = await doctor.doctorIdCounter();
            console.log("   doctorIdCounter:", count.toString());
        } catch(e) {
            console.log("   doctorIdCounter ERROR:", e.message.slice(0,50));
        }
        
        // 5. Check Hospital
        console.log("\n5. Hospital");
        try {
            const hospitalAC = await hospital.accessControl();
            console.log("   accessControl:", hospitalAC);
        } catch(e) { console.log("   ERROR:", e.message.slice(0,50)); }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};