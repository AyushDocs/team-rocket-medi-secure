import { patientDetailsContract, patientContract, handoffManagerContract, wellnessRewardsContract } from "../config/contracts.js";
import web3 from "../config/web3.js";
import { generatePremiumProof, verifyPremiumProof } from "../services/zkpService.js";
import { resolvePatientAddress, getPatientByIdentifier } from "../services/patientResolver.js";
import { estimateGas, sendTransaction, handleContractError } from "../services/web3Helpers.js";
import { vitalService, userService, auditService } from "../services/database.js";
import { invalidateCache } from "../services/cache.js";
import { generateWellnessProof } from "../services/zkpService.js";

/**
 * Sync vitals from an authorized provider (like PremKatha Clinical Engine)
 * This writes to the PatientDetails smart contract and SQLite.
 */
export const syncVitals = async (req, res) => {
    try {
        const { patientAddress, sbp, heartRate, temperature } = req.body;

        if (!patientAddress || !sbp || !heartRate) {
            return res.status(400).json({ error: "Missing required vitals data" });
        }

        if (!web3.utils.isAddress(patientAddress)) {
            return res.status(400).json({ error: "Invalid patient address" });
        }

        const accounts = await web3.eth.getAccounts();
        const hospitalAdmin = accounts[0];

        console.log(`[SANJEEVNI] Syncing vitals for ${patientAddress} via ${hospitalAdmin}`);

        const contractMethod = patientDetailsContract.methods.setVitalsForPatient(
            patientAddress,
            sbp,
            heartRate,
            temperature || "98.6 F"
        );
        
        const gasLimit = await estimateGas(contractMethod, hospitalAdmin);
        const tx = await contractMethod.send({ from: hospitalAdmin, gas: gasLimit });

        // Also store in SQLite for fast queries
        try {
            const user = await userService.findByWallet(patientAddress);
            if (user?.patientData) {
                const [systolic, diastolic] = sbp.split('/').map(Number);
                await vitalService.create(user.patientData.id, {
                    systolicBP: systolic,
                    diastolicBP: diastolic,
                    heartRate: parseInt(heartRate),
                    temperature: parseFloat(temperature?.replace(' F', '') || '98.6'),
                    source: 'premkatha',
                    transactionHash: tx.transactionHash,
                });
            }
        } catch (dbError) {
            console.warn("[DB] Failed to store vitals locally:", dbError.message);
        }

        // Audit log
        try {
            await auditService.log({
                userId: user?.id,
                action: "vitals_synced",
                entityType: "patient",
                entityId: patientAddress,
                details: { sbp, heartRate, temperature },
            });
        } catch (e) { /* ignore audit errors */ }

        // Invalidate patient cache
        try {
            await invalidateCache(`patient:${patientAddress}`);
        } catch (e) { /* ignore cache errors */ }

        res.json({
            status: "SUCCESS",
            transactionHash: tx.transactionHash,
            gasUsed: tx.gasUsed,
            patient: patientAddress,
            vitals: { sbp, heartRate, temperature }
        });

    } catch (error) {
        const handled = handleContractError(error, "Vitals Sync");
        res.status(500).json(handled);
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
 * Aggregates all clinical history (Handoffs + Records) for a patient.
 * Enables AI Engines (PremKatha) to provide long-term patient trajectory analysis.
 */
export const getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Resolve patient ID to wallet address using improved resolver
        const patient = await getPatientByIdentifier(id);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        
        const address = patient.walletAddress;
        const patientId = patient.id;

        // 2. Fetch all Handoff Sessions from HandoffManager
        const handoffs = await handoffManagerContract.methods.getPatientHandoffHistory(address).call();
        
        // 3. Fetch all Medical Records
        let records = [];
        try {
            records = await patientContract.methods.getMedicalRecords(patientId).call();
        } catch(e) { /* skip records if invalid ID */ }

        res.json({
            patientId: id,
            address: address,
            patientName: patient.name,
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

/**
 * Resolves a patient's on-chain wallet from their ID/Username
 */
export const resolvePatientAddressFromId = async (req, res) => {
    const { id } = req.params;
    
    const patient = await getPatientByIdentifier(id);
    if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json({ address: patient.walletAddress });
};
/**
 * Claim Wellness Rewards using a ZK-Proof of healthy vitals
 */
export const claimWellnessRewards = async (req, res) => {
    try {
        const { patientAddress } = req.body;
        
        // 1. Fetch current vitals
        const vitals = await patientDetailsContract.methods.getVitals(patientAddress).call();
        
        // 2. Generate Proof locally (Prover service)
        const zkp = await generateWellnessProof({
            sbp: vitals.bloodPressure,
            heartRate: vitals.heartRate,
            temperature: vitals.temperature
        });

        if (!zkp.isHealthy) {
            return res.status(400).json({ error: "Vitals do not meet healthy criteria for rebate" });
        }

        // 3. Submit to Blockchain via Relayer (Admin account)
        const accounts = await web3.eth.getAccounts();
        const relayer = accounts[0];
        
        console.log(`[WELLNESS] Relaying proof for ${patientAddress} via ${relayer}`);

        const tx = await wellnessRewardsContract.methods.submitWellnessProofFor(
            patientAddress,
            web3.utils.utf8ToHex(zkp.proof)
        ).send({ from: relayer, gas: 500000 });

        res.json({
            status: "SUCCESS",
            message: "Wellness rebate claimed successfully!",
            transactionHash: tx.transactionHash,
            reward: "50 SANJ"
        });

    } catch (error) {
        console.error("Rebate Claim Failed:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Gasless Consent Granting (EIP-712 Relayer)
 */
export const grantConsentGasless = async (req, res) => {
    try {
        const { doctorAddress, patientAddress, signature, metadataURI } = req.body;

        const accounts = await web3.eth.getAccounts();
        const relayer = accounts[0];

        const tx = await patientContract.methods.grantConsentWithSignature(
            doctorAddress,
            metadataURI || "",
            patientAddress,
            signature
        ).send({ from: relayer, gas: 400000 });

        res.json({
            status: "SUCCESS",
            message: "Consent granted gaslessly!",
            transactionHash: tx.transactionHash
        });
    } catch (error) {
        console.error("Gasless Consent Failed:", error);
        res.status(500).json({ error: error.message });
    }
};
