import { insuranceContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

/**
 * Submit a clinical insurance claim for a procedure (Step 1)
 */
export const submitAutoClaim = async (req, res) => {
    try {
        const { requestId, procedureName, cost, evidenceHash, patientAddress } = req.body;
        
        // Use provided patient address or default to accounts[1] (Patient)
        const accounts = await web3.eth.getAccounts();
        const caller = patientAddress || accounts[1];

        console.log(`[SANJEEVNI] Submitting clinical insurance claim for ${procedureName} (Cost: ${cost} tokens)`);

        const tx = await insuranceContract.methods.submitClaim(
            requestId || 1, // Default quest for demo
            procedureName,
            cost,
            evidenceHash
        ).send({ from: caller, gas: 500000 });

        res.json({
            status: "CLAIM_SUBMITTED",
            claimId: tx.events.ClaimSubmitted.returnValues.claimId.toString(),
            transactionHash: tx.transactionHash
        });

    } catch (error) {
        console.error("Insurance Claim Failed:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetch all claims for a patient
 */
export const getMyClaims = async (req, res) => {
    try {
        const { address } = req.params;
        const history = await insuranceContract.methods.getPatientClaims(address).call();
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetch all policies available in the marketplace
 */
export const listPolicies = async (req, res) => {
    try {
        const policies = await insuranceContract.methods.getAllActivePolicies().call();
        res.json(policies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
