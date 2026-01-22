# Zero-Knowledge Proof (ZKP) Insurance Integration

This directory contains the `Circom` circuits used for selective disclosure of health data.

## Purpose
Insurance companies can verify that a patient meets specific health criteria (like age or vaccination status) to calculate premiums or grant discounts, **without ever seeing the raw data**.

## Files
- `circuits/premium_calc.circom`: The main circuit for verifying:
    - Age >= Threshold (e.g., 18)
    - Vaccination Status (e.g., Valid)
    - Blood Pressure within healthy ranges

## How it works (The ZK Flow)
1. **Circuit Setup**: The circuit is compiled to generate a `witness` and a `proving key`.
2. **Patient Side**: 
    - Patient inputs their **Private Vitals** (age, bp, etc.) and the **Public Thresholds** into the circuit.
    - The circuit generates a `proof.json` and `public.json`.
3. **Insurance Side**:
    - The insurance company (or a Smart Contract) receives the `proof.json` and the `isEligible` result.
    - They verify the proof using a `verification key`.
    - If valid, they know the patient is "eligible" but **don't know** the patient's actual age or BP values.

## Next Steps
1. **Install Dependencies**:
   ```bash
   npm install circomlib snarkjs
   ```
2. **Compile Circuit**:
   ```bash
   circom circuits/premium_calc.circom --r1cs --wasm --sym --c
   ```
3. **Generate Solidity Verifier**:
   ```bash
   snarkjs zkey export solidityverifier premium_calc_final.zkey Verifier.sol
   ```
4. **On-Chain Integration**:
   - Deploy `Verifier.sol`.
   - Update `Marketplace.sol` to accept ZK-Proofs for insurance quotes.
