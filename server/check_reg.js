import Web3 from "web3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");
const patientArtifact = JSON.parse(fs.readFileSync("./contracts/Patient.json", "utf8"));
const patientAddress = patientArtifact.networks["1337"].address;
const patientContract = new web3.eth.Contract(patientArtifact.abi, patientAddress);

const userWallet = "0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5";

async function check() {
    console.log("Checking Patient contract at:", patientAddress);
    const isRegistered = await patientContract.methods.isRegistered(userWallet).call();
    console.log("Is user registered?", isRegistered);
    
    const patientId = await patientContract.methods.walletToPatientId(userWallet).call();
    console.log("Patient ID:", patientId.toString());
}

check().catch(console.error);
