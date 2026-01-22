import { CONFIG } from "../config/constants.js";
import { marketplaceContract } from "../config/contracts.js";
import { executeComputeJob } from "../services/computeService.js";

export const executeCompute = async (req, res) => {
    const { userAddress, signature, ipfsHashes, script, jobId: clientJobId } = req.body;

    try {
        if (!userAddress || !ipfsHashes || !script) {
            return res.status(400).json({ error: CONFIG.MESSAGES.MISSING_PARAMS });
        }

        // 1. Verify access
        for (const hash of ipfsHashes) {
            const hasAccess = await marketplaceContract.methods
                .hasPurchased(userAddress, hash)
                .call();
            
            if (!hasAccess) {
                return res.status(403).json({ error: `You do not have purchase records for dataset: ${hash}` });
            }
        }

        // 2. Execute
        const result = await executeComputeJob(userAddress, ipfsHashes, script);
        res.json(result);

    } catch (error) {
        console.error("Compute Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};
