import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function check() {
    const artifact = JSON.parse(fs.readFileSync('../frontend/contracts/Patient.json', 'utf8'));
    const addr = artifact.networks['1337'].address;
    const contract = new web3.eth.Contract(artifact.abi, addr);

    const count = await contract.methods.patientCount().call();
    console.log(`Patient Count: ${count}`);
}

check().catch(console.error);
