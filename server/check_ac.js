import Web3 from "web3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");
const acArtifact = JSON.parse(fs.readFileSync("./contracts/MediSecureAccessControl.json", "utf8"));
const acAddress = "0x7414e38377D6DAf6045626EC8a8ABB8a1BC4B97a";
const acContract = new web3.eth.Contract(acArtifact.abi, acAddress);

const patientAddress = "0x5b1869D9A4C187F2EAa108f3062412ecf0526b24";

async function check() {
    console.log("Checking MediSecureAccessControl at:", acAddress);
    const isAuthorized = await acContract.methods.authorizedManagers(patientAddress).call();
    console.log(`Is Patient contract (${patientAddress}) authorized?`, isAuthorized);
}

check().catch(console.error);
