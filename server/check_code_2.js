import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");
const addr = "0xe78a0f7e598cc8b0bb87894b0f60dd2a88d6a8ab";

async function check() {
    const code = await web3.eth.getCode(addr);
    console.log(`Code at ${addr}:`, code === "0x" ? "EMPTY" : "EXISTS (" + code.length + " bytes)");
}

check().catch(console.error);
