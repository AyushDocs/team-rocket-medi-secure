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
