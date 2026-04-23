import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function check() {
    const patientArtifact = JSON.parse(fs.readFileSync('../frontend/contracts/Patient.json', 'utf8'));
    const patientAddr = patientArtifact.networks['1337'].address;
    console.log(`Checking Patient at: ${patientAddr}`);
}

check().catch(console.error);
