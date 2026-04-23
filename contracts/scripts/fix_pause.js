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
        
        console.log("=== EMERGENCY FIX: Force Unpause All Contracts ===");
        
        // Check paused state
        console.log("\nPaused state before:");
        console.log("  Patient:", await patient.paused());
        
        // Unpause Patient if needed
        if (await patient.paused()) {
            await patient.unpause({ from: accounts[0] });
            console.log("Patient unpaused");
        }
        
        // Unpause Doctor if needed
        try {
            const docPaused = await doctor.paused();
            console.log("  Doctor:", docPaused);
            if (docPaused) {
                await doctor.unpause({ from: accounts[0] });
                console.log("Doctor unpaused");
            }
        } catch(e) {
            console.log("  Doctor: N/A (not pausable)");
        }
        
        // Unpause Hospital if needed
        try {
            const hospPaused = await hospital.paused();
            console.log("  Hospital:", hospPaused);
            if (hospPaused) {
                await hospital.unpause({ from: accounts[0] });
                console.log("Hospital unpaused");
            }
        } catch(e) {
            console.log("  Hospital: N/A (not pausable)");
        }
        
        // Unpause Marketplace
        try {
            const mktPaused = await marketplace.paused();
            console.log("  Marketplace:", mktPaused);
            if (mktPaused) {
                await marketplace.unpause({ from: accounts[0] });
                console.log("Marketplace unpaused");
            }
        } catch(e) {
            console.log("  Marketplace: N/A (not pausable)");
        }
        
        // Unpause Insurance
        try {
            const insPaused = await insurance.paused();
            console.log("  Insurance:", insPaused);
            if (insPaused) {
                await insurance.unpause({ from: accounts[0] });
                console.log("Insurance unpaused");
            }
        } catch(e) {
            console.log("  Insurance: N/A (not pausable)");
        }
        
        // Now check accessControl paused
        console.log("\n  AccessControl:", await ac.paused());
        if (await ac.paused()) {
            await ac.unpause({ from: accounts[0] });
            console.log("AccessControl unpaused");
        }
        
        console.log("\nPaused state after:");
        console.log("  Patient:", await patient.paused());
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};