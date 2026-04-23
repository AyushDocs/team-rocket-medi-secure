const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const patient = await Patient.deployed();

        console.log("\n=== ATTEMPT WITH HIGHER GAS ===");
        
        // Try from account[0] with much higher gas
        try {
            const tx = await patient.registerPatient(
                "newpatient1", 
                "New Patient One", 
                "newpatient1@test.com", 
                30, 
                "O+", 
                { from: accounts[0], gas: 500000 }
            );
            console.log("SUCCESS from account[0]!");
        } catch(e) {
            console.log("Error from account[0]:", e.message);
            console.log("\nFull error details:");
            console.log(JSON.stringify(e, null, 2));
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};