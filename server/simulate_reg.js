import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function simulate() {
    const patientArtifact = JSON.parse(fs.readFileSync('../frontend/contracts/Patient.json', 'utf8'));
    const patientAddr = patientArtifact.networks['1337'].address;
    const patientContract = new web3.eth.Contract(patientArtifact.abi, patientAddr);

    const userAddr = '0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5';
    
    try {
        await patientContract.methods.registerPatient(
            "testuser",
            "Test Name",
            "test@example.com",
            30,
            "O+"
        ).call({ from: userAddr });
        console.log("Call successful!");
    } catch (error) {
        console.log("Call failed!");
        console.error(error);
    }
}

simulate().catch(console.error);
