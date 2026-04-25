const Doctor = artifacts.require("Doctor");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const admin = accounts[0];
        console.log("Using Admin Account:", admin);

        const doctor = await Doctor.deployed();
        console.log("Doctor Address:", doctor.address);
        
        try {
            const acAddr = await doctor.accessControl();
            console.log("Doctor's AC address:", acAddr);
        } catch(e) { console.log("Failed to get AC addr from Doctor:", e.message); }

        try {
            const ac = await MediSecureAccessControl.deployed();
            console.log("Actual AC address (Deployed):", ac.address);
            
            const roleHash = await ac.getRoleHash(0); // Roles.ADMIN
            console.log("ADMIN Role Hash:", roleHash);
            
            const hasRole = await ac.hasRole(roleHash, admin);
            console.log("Admin has ADMIN_ROLE in AC?", hasRole);
        } catch(e) { console.log("Failed to check AC directly:", e.message); }

        try {
            const isAdmin = await doctor.isAdmin(admin);
            console.log("Doctor.isAdmin(admin) result:", isAdmin);
        } catch(e) { console.log("Doctor.isAdmin(admin) REVERTED:", e.message); }
        
        callback();
    } catch (e) {
        console.error("GLOBAL ERROR:", e.message);
        callback(e);
    }
}
