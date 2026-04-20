const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        const patient = await Patient.deployed();

        console.log("=== DEBUGGING REGISTER PATIENT ===");
        
        // Let's trace through each step in registerPatient
        const user = "patient1";
        const name = "Patient One";
        const email = "patient1@test.com";
        const age = 30;
        const blood = "O+";
        
        console.log("\n1. Checking walletToPatientId[accounts[1]]...");
        const existingId = await patient.walletToPatientId(accounts[1]);
        console.log("   Result:", existingId.toString());
        
        console.log("\n2. Checking usernameToPatientId[user]...");
        const existingUserId = await patient.usernameToPatientId(user);
        console.log("   Result:", existingUserId.toString());
        
        // Try using .call to get the revert reason without spending gas
        console.log("\n3. Trying to call via .call()...");
        try {
            await patient.registerPatient.call(user, name, email, age, blood, { from: accounts[1] });
            console.log("   Call succeeded!");
        } catch(e) {
            console.log("   Call reverted with:", e.message);
            // Try to get the revert data
            const result = await web3.eth.call({
                to: patient.address,
                data: web3.utils.encodeFunctionCall(
                    'registerPatient(string,string,string,uint256,string)',
                    [user, name, email, web3.utils.toHex(age), blood]
                ),
                from: accounts[1]
            });
            console.log("   Result:", result);
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};