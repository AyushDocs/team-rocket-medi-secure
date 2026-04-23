const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    
    const addresses = {
        "Patient (ABI)": "0x11632F9766Ee9d9317F95562a6bD529652ead78f",
        "Patient (Proxy)": "0x718e1497188318aDdf7e38b8318747006541F888",
        "Doctor (Proxy)": "0x32e02F2934824ec085298E2B4e0e07935Ec6DaeC"
    };

    for (const [name, addr] of Object.entries(addresses)) {
        try {
            const code = await provider.getCode(addr);
            console.log(`${name} at ${addr}: ${code === "0x" ? "NO CODE" : "HAS CODE (" + code.length + " bytes)"}`);
        } catch (e) {
            console.log(`${name} at ${addr}: ERROR ${e.message}`);
        }
    }
    
    const network = await provider.getNetwork();
    console.log(`Network chainId: ${network.chainId}`);
}

main().catch(console.error);
