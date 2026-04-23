import web3 from "../config/web3.js";

/**
 * Estimates gas for a transaction before sending
 */
export const estimateGas = async (contractMethod, fromAddress) => {
    try {
        const gasEstimate = await contractMethod.estimateGas({ from: fromAddress });
        // Add 20% buffer for safety
        return Math.floor(Number(gasEstimate) * 1.2);
    } catch (error) {
        // Return default gas limit if estimation fails
        console.warn(`Gas estimation failed, using default: ${error.message}`);
        return 300000;
    }
};

/**
 * Send a transaction with proper gas estimation and error handling
 */
export const sendTransaction = async (contractMethod, fromAddress, customGasLimit = null) => {
    const gasLimit = customGasLimit || await estimateGas(contractMethod, fromAddress);
    
    try {
        const tx = await contractMethod.send({ 
            from: fromAddress, 
            gas: gasLimit 
        });
        return tx;
    } catch (error) {
        // Parse common contract errors
        if (error.message.includes("insufficient funds")) {
            throw new Error("Insufficient funds for transaction");
        }
        if (error.message.includes("gas required")) {
            throw new Error("Transaction requires more gas than provided");
        }
        if (error.message.includes("revert")) {
            // Extract revert reason if possible
            const match = error.message.match(/revert ([^"]+)/);
            throw new Error(match ? `Contract reverted: ${match[1]}` : "Transaction reverted by contract");
        }
        throw error;
    }
};

/**
 * Handle errors in a consistent way for API controllers
 */
export const handleContractError = (error, context = "Operation") => {
    console.error(`[ERROR] ${context}:`, error.message);
    
    if (error.message.includes("insufficient funds")) {
        return { error: "Insufficient funds for this transaction" };
    }
    if (error.message.includes("gas required")) {
        return { error: "Transaction requires more gas. Please try again." };
    }
    if (error.message.includes("revert")) {
        const match = error.message.match(/revert ([^"]+)/);
        return { error: match ? `Transaction failed: ${match[1]}` : "Transaction failed" };
    }
    if (error.message.includes("nonce")) {
        return { error: "Transaction nonce error. Please refresh and try again." };
    }
    if (error.message.includes("connection")) {
        return { error: "Unable to connect to blockchain. Please check your connection." };
    }
    
    return { error: `${context} failed: ${error.message}` };
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
    return address && web3.utils.isAddress(address);
};

/**
 * Format Wei to Ether
 */
export const weiToEther = (wei) => {
    return web3.utils.fromWei(wei, 'ether');
};

/**
 * Format Ether to Wei
 */
export const etherToWei = (ether) => {
    return web3.utils.toWei(ether.toString(), 'ether');
};
