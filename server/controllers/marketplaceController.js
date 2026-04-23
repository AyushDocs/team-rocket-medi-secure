import { marketplaceContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

/**
 * Sell Medical Data Gaslessly (EIP-712)
 */
export const sellDataGasless = async (req, res) => {
    try {
        const { offerId, ipfsHash, patientAddress, signature } = req.body;

        const accounts = await web3.eth.getAccounts();
        const relayer = accounts[0];

        console.log(`[RELAYER] Processing gasless data sale for ${patientAddress}`);

        const tx = await marketplaceContract.methods.sellDataWithSignature(
            offerId,
            ipfsHash,
            patientAddress,
            signature
        ).send({ from: relayer, gas: 500000 });

        res.json({
            status: "SUCCESS",
            message: "Data sale processed gaslessly!",
            transactionHash: tx.transactionHash
        });

    } catch (error) {
        console.error("Gasless Sale Failed:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * List all active research data offers
 */
export const getActiveOffers = async (req, res) => {
    try {
        const offers = await marketplaceContract.methods.getAllOffers().call();
        res.json(offers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get pending earnings for a patient
 */
export const getEarnings = async (req, res) => {
    try {
        const { address } = req.params;
        const ethEarnings = await marketplaceContract.methods.pendingEarnings(address).call();
        const tokenEarnings = await marketplaceContract.methods.pendingTokenEarnings(address).call();
        
        res.json({
            eth: web3.utils.fromWei(ethEarnings, 'ether'),
            token: web3.utils.fromWei(tokenEarnings, 'ether')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
