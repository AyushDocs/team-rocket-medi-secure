import Web3 from "web3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");
const patientArtifact = JSON.parse(fs.readFileSync("./contracts/Patient.json", "utf8"));
const patientAddress = patientArtifact.networks["1337"].address;
const patientContract = new web3.eth.Contract(patientArtifact.abi, patientAddress);

async function check() {
    console.log("Patient contract at:", patientAddress);
    try {
        const acAddress = await patientContract.methods.accessControl().call();
        console.log("AccessControl address in Patient contract:", acAddress);
        
        const code = await web3.eth.getCode(acAddress);
        console.log(`Code at AccessControl address (${acAddress}):`, code === "0x" ? "EMPTY" : "EXISTS (" + code.length + " bytes)");
    } catch (e) {
        console.error("Error calling accessControl():", e.message);
    }
}

check().catch(console.error);
