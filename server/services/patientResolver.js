import { patientContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

/**
 * Resolves a patient ID from various identifiers:
 * - Numeric ID (1, 2, 3...)
 * - Username (SK-999, john_doe...)
 * - Wallet address
 * Returns the blockchain patient ID or null if not found
 */
export const resolvePatientId = async (identifier) => {
    if (!identifier) return null;
    
    const identifierStr = String(identifier).trim();
    
    // Check if it's a valid Ethereum address
    if (web3.utils.isAddress(identifierStr)) {
        try {
            const patientId = await patientContract.methods.walletToPatientId(identifierStr).call();
            return patientId && patientId !== "0" ? patientId : null;
        } catch (e) {
            return null;
        }
    }
    
    // Check if it's a numeric ID
    const numericId = parseInt(identifierStr, 10);
    if (!isNaN(numericId) && numericId > 0) {
        try {
            const exists = await patientContract.methods.getPatientDetails(numericId).call();
            return exists ? numericId : null;
        } catch (e) {
            return null;
        }
    }
    
    // Treat as username
    try {
        const patientId = await patientContract.methods.getPatientIdByUsername(identifierStr).call();
        return patientId && patientId !== "0" ? patientId : null;
    } catch (e) {
        return null;
    }
};

/**
 * Resolves a patient wallet address from various identifiers
 */
export const resolvePatientAddress = async (identifier) => {
    const patientId = await resolvePatientId(identifier);
    if (!patientId) return null;
    
    try {
        const details = await patientContract.methods.getPatientDetails(patientId).call();
        return details.walletAddress || details[3] || null;
    } catch (e) {
        return null;
    }
};

/**
 * Validates that a patient exists and returns their details
 */
export const getPatientByIdentifier = async (identifier) => {
    const patientId = await resolvePatientId(identifier);
    if (!patientId) return null;
    
    try {
        const details = await patientContract.methods.getPatientDetails(patientId).call();
        return {
            id: patientId,
            username: details.username || details[1],
            name: details.name || details[2],
            walletAddress: details.walletAddress || details[3],
            email: details.email || details[4],
            age: details.age || details[5],
            bloodGroup: details.bloodGroup || details[6]
        };
    } catch (e) {
        return null;
    }
};
