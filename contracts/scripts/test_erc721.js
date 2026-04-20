const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== TESTING WITHOUT ERC2771 FORWARDER ===");
        
        const patient = await Patient.deployed();
        
        // Try to call with explicit settings to bypass forwarder
        // Let's see what trustedForwarder is
        const forwarder = await patient.trustedForwarder();
        console.log("Trusted forwarder:", forwarder);
        
        // Try different approach: use sendTransaction directly without forwarder
        // Actually, let's try calling a non-write function first
        console.log("\nTesting non-write functions...");
        
        // Try balanceOf (inherited from ERC721)
        try {
            const balance = await patient.balanceOf(accounts[0]);
            console.log("balanceOf(accounts[0]):", balance.toString());
        } catch(e) {
            console.log("balanceOf FAILED:", e.message.slice(0,80));
        }
        
        // Try ownerOf with token 0
        try {
            const owner = await patient.ownerOf(0);
            console.log("ownerOf(0):", owner);
        } catch(e) {
            console.log("ownerOf(0):", e.message.slice(0,50));
        }
        
        // Try tokenByIndex
        try {
            const token = await patient.tokenByIndex(0);
            console.log("tokenByIndex(0):", token.toString());
        } catch(e) {
            console.log("tokenByIndex(0):", e.message.slice(0,50));
        }
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};