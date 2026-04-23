import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");

async function check() {
    const blockNumber = await web3.eth.getBlockNumber();
    console.log("Current block number:", blockNumber.toString());
    
    // Check last 100 blocks for contract creations
    for (let i = blockNumber; i >= Math.max(0, Number(blockNumber) - 100); i--) {
        const block = await web3.eth.getBlock(i, true);
        for (const tx of block.transactions) {
            if (tx.to === null) {
                const receipt = await web3.eth.getTransactionReceipt(tx.hash);
                console.log(`Contract created at block ${i}: ${receipt.contractAddress}`);
            }
        }
    }
}

check().catch(console.error);
