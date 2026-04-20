import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function check() {
    const acArtifact = JSON.parse(fs.readFileSync('../frontend/contracts/MediSecureAccessControl.json', 'utf8'));
    const acAddr = acArtifact.networks['1337'].address;
    const acContract = new web3.eth.Contract(acArtifact.abi, acAddr);

    const isPaused = await acContract.methods.paused().call();
    console.log(`AccessControl paused? ${isPaused}`);
}

check().catch(console.error);
