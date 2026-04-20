import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function check() {
    const artifact = JSON.parse(fs.readFileSync('../frontend/contracts/Patient.json', 'utf8'));
    const addr = artifact.networks['1337'].address;
    const contract = new web3.eth.Contract(artifact.abi, addr);

    const p1 = await contract.methods.patients(1).call();
    const p2 = await contract.methods.patients(2).call();
    console.log("Patient 1:", p1);
    console.log("Patient 2:", p2);
}

check().catch(console.error);
