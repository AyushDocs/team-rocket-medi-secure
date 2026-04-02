import { handoffManagerContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

/**
 * Initiate a decentralized clinical handoff (Nurse Multisig Step 1)
 */
export const initiateHandoff = async (req, res) => {
    try {
        const { patientAddress, reportIpfsHash, nurseAddress } = req.body;
        
        // Use provided nurse address or default to accounts[1] (Off-going Nurse)
        const accounts = await web3.eth.getAccounts();
        const caller = nurseAddress || accounts[1];

        console.log(`[SANJEEVNI] Initiating shift transfer for patient ${patientAddress} by nurse ${caller}`);

        const tx = await handoffManagerContract.methods.initiateHandoff(
            patientAddress,
            reportIpfsHash
        ).send({ from: caller, gas: 500000 });

        res.json({
            status: "AWAITING_RELIEF",
            handoffId: tx.events.HandoffInitiated.returnValues.id.toString(),
            transactionHash: tx.transactionHash
        });

    } catch (error) {
        console.error("Handoff Initiation Failed:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Finalize a decentralized clinical handoff (Nurse Multisig Step 2)
 */
export const finalizeHandoff = async (req, res) => {
    try {
        const { handoffId, reliefNurseAddress } = req.body;
        
        // Use provided relief nurse address or default to accounts[2] (On-coming Nurse)
        const accounts = await web3.eth.getAccounts();
        const relief = reliefNurseAddress || accounts[2];

        console.log(`[SANJEEVNI] Relief nurse ${relief} finalizing handoff session ${handoffId}`);

        const tx = await handoffManagerContract.methods.finalizeHandoff(
            handoffId
        ).send({ from: relief, gas: 500000 });

        res.json({
            status: "SUCCESS",
            handoffId: handoffId,
            onComingNurse: relief,
            finalizedAt: new Date().toISOString(),
            transactionHash: tx.transactionHash
        });

    } catch (error) {
        console.error("Handoff Finalization Failed:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetch historical clinical handoffs for a patient
 */
export const getPatientHandoffs = async (req, res) => {
    try {
        const { address } = req.params;
        const history = await handoffManagerContract.methods.getPatientHandoffHistory(address).call();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
