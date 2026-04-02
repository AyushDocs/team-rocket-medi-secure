import { patientDetailsContract } from "../config/contracts.js";
import web3 from "../config/web3.js";
import { generatePremiumProof, verifyPremiumProof } from "../services/zkpService.js";

/**
 * Sync vitals from an authorized provider (like PremKatha Clinical Engine)
 * This writes to the PatientDetails smart contract.
 */
export const syncVitals = async (req, res) => {
    try {
        const { patientAddress, sbp, heartRate, temperature } = req.body;

        if (!patientAddress || !sbp || !heartRate) {
            return res.status(400).json({ error: "Missing required vitals data" });
        }

        // In a real app, the server would sign with the Hospital/Owner primary key.
        // For Ganache demo, we use accounts[0].
        const accounts = await web3.eth.getAccounts();
        const hospitalAdmin = accounts[0];

        console.log(`[SANJEEVNI] Syncing vitals for ${patientAddress} via ${hospitalAdmin}`);

        const tx = await patientDetailsContract.methods.setVitalsForPatient(
            patientAddress,
            sbp,
            heartRate,
            temperature || "98.6 F"
        ).send({ from: hospitalAdmin, gas: 300000 });

        res.json({
            status: "SUCCESS",
            transactionHash: tx.transactionHash,
            patient: patientAddress,
            vitals: { sbp, heartRate, temperature }
        });

    } catch (error) {
        console.error("Vitals Sync Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Generate a Zero-Knowledge Proof for Clinical Stability & Premium Eligibility
 */
export const generateZKP = async (req, res) => {
    try {
        const { privateInputs, publicInputs } = req.body;
        
        // Defaults if thresholds are missing
        const thresholds = publicInputs || {
            minAge: 18,
            requiredVaccinationStatus: 1,
            maxSystolicBP: 130,
            maxDiastolicBP: 85
        };

        const result = await generatePremiumProof(privateInputs, thresholds);
        res.json(result);

    } catch (error) {
        console.error("ZKP Generation Failed:", error);
        res.status(500).json({ error: "Prover Failure: " + error.message });
    }
};

/**
 * Resolve IPFS CID for a specific patient report (Proof-of-Handoff)
 */
export const syncAlert = async (req, res) => {
    try {
        const { patientAddress, issue, severity } = req.body;
        const accounts = await web3.eth.getAccounts();
        const tx = await patientDetailsContract.methods.triggerClinicalAlert(
            patientAddress,
            issue,
            severity || "medium"
        ).send({ from: accounts[0], gas: 300000 });

        res.json({ status: "SUCCESS", transactionHash: tx.transactionHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetch Clinical Safety History from Blockchain
 */
export const getAlerts = async (req, res) => {
    try {
        const { address } = req.params;
        const alerts = await patientDetailsContract.methods.getAlerts(address).call();
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Simple helper to fetch a patient's on-chain wallet from their ID/Username
 * (For the PremKatha -> Sanjeevni mapping)
 */
export const resolvePatientAddress = async (req, res) => {
    const { id } = req.params;
    // Map SK-999 to the first patient address in our local Ganache
    const accounts = await web3.eth.getAccounts();
    const map = {
        "1": accounts[1],
        "SK-999": accounts[1],
        "SK-123": accounts[2]
    };
    res.json({ address: map[id] || accounts[1] });
};

/**
 * Aggregates all clinical history (Handoffs + Records) for a patient.
 * Enables AI Engines (PremKatha) to provide long-term patient trajectory analysis.
 */
export const getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Resolve patient ID to wallet address
        const accounts = await web3.eth.getAccounts();
        const map = { "1": accounts[1], "SK-999": accounts[1], "SK-123": accounts[2] };
        const address = map[id] || accounts[1];

        // 2. Fetch all Handoff Sessions from HandoffManager
        const handoffs = await handoffManagerContract.methods.getPatientHandoffHistory(address).call();
        
        // 3. Fetch all Medical Records from Patient contract (if ID is numeric)
        let records = [];
        try {
             // For the demo SK-999 is ID 1
             const pId = (id === "SK-999") ? 1 : parseInt(id);
             records = await patientContract.methods.getMedicalRecords(pId).call();
        } catch(e) { /* skip records if invalid ID */ }

        res.json({
            patientId: id,
            address: address,
            handoffTimeline: (handoffs || []).map(h => ({
                id: h.id.toString(),
                startTime: h.startTime.toString(),
                status: h.status,
                reportIpfsHash: h.reportIpfsHash
            })),
            recordTimeline: (records || []).map(r => ({
                fileName: r.fileName,
                ipfsHash: r.ipfsHash,
                date: r.recordDate,
                hospital: r.hospital
            }))
        });

    } catch (error) {
        console.error("Clinical History Aggregation Failed:", error);
        res.status(500).json({ error: error.message });
    }
};
