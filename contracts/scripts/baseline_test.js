module.exports = async function(callback) {
    try {
        const accounts = await web3.eth.getAccounts();
        
        console.log("=== BASELINE TEST: Simple ETH Transfer ===");
        
        // Test 1: Simple ETH transfer (no contract interaction)
        console.log("\n1. Testing simple ETH transfer...");
        const bal1Before = await web3.eth.getBalance(accounts[1]);
        const bal2Before = await web3.eth.getBalance(accounts[2]);
        console.log(`   Account[1] before: ${web3.utils.fromWei(bal1Before, 'ether')} ETH`);
        console.log(`   Account[2] before: ${web3.utils.fromWei(bal2Before, 'ether')} ETH`);
        
        try {
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: accounts[1],
                value: web3.utils.toWei("1", "ether"),
                gas: 21000
            });
            console.log("   SUCCESS!");
        } catch(e) {
            console.log("   FAILED:", e.message);
        }
        
        const bal1After = await web3.eth.getBalance(accounts[1]);
        console.log(`   Account[1] after: ${web3.utils.fromWei(bal1After, 'ether')} ETH`);
        
        callback();
    } catch(e) {
        console.log("Error:", e.message);
        callback(e);
    }
};