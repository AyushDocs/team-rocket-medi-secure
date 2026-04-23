module.exports = async function(callback) {
    try {
        const Patient = artifacts.require("Patient");
        
        console.log("=== CHECKING ARTIFACTS VERSION ===");
        
        // Check what artifacts we have
        const patient = await Patient.deployed();
        
        // Get the bytecode hash to see if it matches compiled version
        const code = await web3.eth.getCode(patient.address);
        console.log("Patient bytecode length:", code.length);
        console.log("First 50 chars:", code.slice(0, 50));
        
        // Check the implementation in artifacts
        const artifact = require('./build/contracts/Patient.json');
        console.log("\nArtifact compiler version:", artifact.compiler.version);
        console.log("Artifact bytecode length:", artifact.bytecode.length);
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};