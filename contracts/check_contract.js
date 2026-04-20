
const Web3 = require("web3");
const web3 = new Web3("http://localhost:8545");

async function checkContract() {
    const addr = "0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF";
    const code = await web3.eth.getCode(addr);
    console.log(`Code at ${addr} length: ${code.length}`);
    
    // Check if it has getRoleHash (unique to AccessControl) or getMinDelay (unique to Timelock)
    const getRoleHashSig = web3.utils.keccak256("getRoleHash(uint8)").slice(0, 10);
    const getMinDelaySig = web3.utils.keccak256("getMinDelay()").slice(0, 10);
    
    console.log(`Checking signatures:`);
    console.log(`  getRoleHash(uint8): ${getRoleHashSig} - ${code.includes(getRoleHashSig.slice(2)) ? "FOUND" : "NOT FOUND"}`);
    console.log(`  getMinDelay(): ${getMinDelaySig} - ${code.includes(getMinDelaySig.slice(2)) ? "FOUND" : "NOT FOUND"}`);
    
    const accounts = await web3.eth.getAccounts();
    console.log(`Deployed by first account? Nonce of ${accounts[0]}: ${await web3.eth.getTransactionCount(accounts[0])}`);
}

checkContract();
