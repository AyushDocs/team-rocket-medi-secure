import * as snarkjs from "snarkjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to our ZK-Assets
const CIRCUIT_WASM = path.resolve(__dirname, "../../zk/circuits/premium_calc_js/premium_calc.wasm");
const CIRCUIT_ZKEY = path.resolve(__dirname, "../../zk/circuits/premium_calc_final.zkey");
const VERIFICATION_KEY = path.resolve(__dirname, "../../zk/circuits/verification_key.json");

/**
 * Generates a Zero-Knowledge Proof for Clinical Stability & Premium Eligibility.
 * This proves (Age > minAge AND BP < maxBP) without revealing the patient's actual values.
 */
export const generatePremiumProof = async (privateInputs, publicInputs) => {
    try {
        console.log("--- GENERATING ZK-PROOF (SNARKJS) ---");
        
        // Merge inputs according to premium_calc.circom
        const inputs = {
            ...privateInputs, // age, vaccinationStatus, systolicBP, diastolicBP
            ...publicInputs   // minAge, requiredVaccinationStatus, maxSystolicBP, maxDiastolicBP
        };

        // 1. Generate Full Proof and Public Signals
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            inputs,
            CIRCUIT_WASM,
            CIRCUIT_ZKEY
        );

        console.log("Proof Generated Successfully!");
        
        // 2. Return payload for on-chain verification
        return {
            proof,
            publicSignals,
            isEligible: publicSignals[0] === "1"
        };

    } catch (err) {
        console.error("ZKP Generation Failed:", err);
        throw new Error("Failed to generate Zero-Knowledge Proof: " + err.message);
    }
};

/**
 * Validates a proof against the verification key locally.
 */
export const verifyPremiumProof = async (proof, publicSignals) => {
    try {
        const vKey = JSON.parse(fs.readFileSync(VERIFICATION_KEY, "utf8"));
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        return res;
    } catch (err) {
        console.error("ZKP Verification Failed:", err);
        return false;
    }
};
/**
 * Generates a Zero-Knowledge Proof for Wellness Rewards.
 * Proves that vitals (BP, Heart Rate) are within healthy limits.
 */
export const generateWellnessProof = async (vitals) => {
    try {
        console.log("--- GENERATING WELLNESS ZK-PROOF ---");
        
        // This would use a specific wellness circuit (e.g., wellness.circom)
        // For demonstration, we'll use a placeholder logic that calls fullProve
        const inputs = {
            sbp: uintToUint256(vitals.sbp),
            hr: uintToUint256(vitals.heartRate),
            temp: uintToUint256(vitals.temperature),
            maxSbp: 140,
            maxHr: 100
        };

        // Note: Real implementation would point to wellness_calc.wasm
        // const { proof, publicSignals } = await snarkjs.groth16.fullProve(...);

        return {
            proof: "0xSAMPLE_PROOF",
            isHealthy: vitals.sbp < 140 && vitals.heartRate < 100
        };
    } catch (err) {
        console.error("Wellness ZKP Generation Failed:", err);
        throw err;
    }
};

function uintToUint256(val) {
    if (typeof val === 'string') return val.split('/')[0];
    return val;
}
