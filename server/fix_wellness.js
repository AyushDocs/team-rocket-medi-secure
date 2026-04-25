import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function fixInterval() {
    const accounts = await web3.eth.getAccounts();
    const admin = accounts[0];
    
    // Load ABI
    const wellnessAbi = JSON.parse(fs.readFileSync('../contracts/build/contracts/WellnessRewards.json', 'utf8')).abi;
    const wellnessAddr = '0xfc059abd0407c6cbf2bd76c940fda27b51f1187d';
    
    const wellness = new web3.eth.Contract(wellnessAbi, wellnessAddr);
    
    try {
        console.log('Setting minimum interval to 0 seconds for testing...');
        await wellness.methods.setInterval(0).send({ from: admin, gas: 100000 });
        console.log('SUCCESS: Interval set to 0.');
        
        const newInterval = await wellness.methods.minimumInterval().call();
        console.log('New Interval:', newInterval);

    } catch (e) {
        console.error('Failed to set interval:', e.message);
    }
}

fixInterval();
