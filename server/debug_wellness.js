import Web3 from 'web3';
import fs from 'fs';

const web3 = new Web3('http://localhost:8545');

async function debug() {
    const patientAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
    
    // Load ABIs
    const tokenAbi = JSON.parse(fs.readFileSync('../contracts/build/contracts/SanjeevniToken.json', 'utf8')).abi;
    const wellnessAbi = JSON.parse(fs.readFileSync('../contracts/build/contracts/WellnessRewards.json', 'utf8')).abi;
    
    // Addresses from environment or common local ones
    const wellnessAddr = '0xfc059abd0407c6cbf2bd76c940fda27b51f1187d';
    
    const wellness = new web3.eth.Contract(wellnessAbi, wellnessAddr);
    
    try {
        const streak = await wellness.methods.patientStreaks(patientAddress).call();
        console.log('--- PATIENT STREAK ---');
        console.log('Count:', streak.count);
        console.log('Last Proof Timestamp:', streak.lastProofTimestamp);
        
        const now = Math.floor(Date.now() / 1000);
        const interval = await wellness.methods.minimumInterval().call();
        console.log('Current Time:', now);
        console.log('Minimum Interval:', interval);
        
        if (Number(now) < Number(streak.lastProofTimestamp) + Number(interval)) {
            console.log('REASON: Still in interval. Next claim possible in', (Number(streak.lastProofTimestamp) + Number(interval) - now) / 3600, 'hours');
        }
        
        const patientDetailsAddr = '0x9A6448b4bab66F952F2431E14562Bcfab7840cE3';
        const detailsAbi = JSON.parse(fs.readFileSync('../contracts/build/contracts/PatientDetails.json', 'utf8')).abi;
        const details = new web3.eth.Contract(detailsAbi, patientDetailsAddr);
        const vitals = await details.methods.getVitals(patientAddress).call();
        console.log('--- VITALS ---');
        console.log('Vitals:', vitals);
        
        if (Number(poolBalance) < 50 * 10**18) {
            console.log('REASON: Insufficient funds in reward pool');
        }

    } catch (e) {
        console.error('Debug failed:', e.message);
    }
}

debug();
