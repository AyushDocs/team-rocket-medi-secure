import express from "express";
import web3 from "../config/web3.js";
import { patientContract, patientDetailsContract } from "../config/contracts.js";
import { resolvePatientAddress, getPatientByIdentifier } from "../services/patientResolver.js";
import { cacheMiddleware } from "../services/cache.js";

const router = express.Router();

const wellnessCache = cacheMiddleware(120, (req) => `wellness:${req.params.patientId}`);

/**
 * Register a new wellness program/wellness center
 */
export const registerWellnessProvider = async (req, res) => {
    try {
        const { name, location, services, walletAddress } = req.body;
        
        if (!name || !walletAddress) {
            return res.status(400).json({ error: "Name and wallet address are required" });
        }

        const accounts = await web3.eth.getAccounts();
        const tx = await patientContract.methods.addMedicalRecord(
            web3.utils.utf8ToHex("wellness-provider"),
            name,
            new Date().toISOString().split('T')[0],
            location || "Online",
            true
        ).send({ from: accounts[0], gas: 300000 });

        res.json({
            status: "SUCCESS",
            transactionHash: tx.transactionHash,
            provider: { name, location, services }
        });
    } catch (error) {
        console.error("Wellness Provider Registration Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Record a yoga therapy session for a patient
 */
export const recordYogaSession = async (req, res) => {
    try {
        const { patientId, instructor, sessionType, duration, notes } = req.body;
        
        const patient = await getPatientByIdentifier(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const accounts = await web3.eth.getAccounts();
        
        // Record the yoga session as a medical record
        const sessionData = JSON.stringify({
            type: "yoga_therapy",
            instructor,
            sessionType,
            duration,
            notes
        });
        
        const ipfsHash = web3.utils.utf8ToHex(sessionData.substring(0, 32));
        
        const tx = await patientContract.methods.addMedicalRecord(
            ipfsHash,
            `Yoga Session - ${sessionType}`,
            new Date().toISOString().split('T')[0],
            "Ved Aashram Wellness Center",
            true
        ).send({ from: accounts[0], gas: 300000 });

        // Also update vitals if provided
        if (duration) {
            await patientDetailsContract.methods.setVitalsForPatient(
                patient.walletAddress,
                "",
                duration,
                ""
            ).send({ from: accounts[0], gas: 200000 });
        }

        res.json({
            status: "SUCCESS",
            transactionHash: tx.transactionHash,
            patientId,
            session: { instructor, sessionType, duration, notes }
        });
    } catch (error) {
        console.error("Yoga Session Recording Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get patient's wellness history (yoga, meditation, retreats)
 */
export const getWellnessHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const patient = await getPatientByIdentifier(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const records = await patientContract.methods.getMedicalRecords(patient.id).call();
        
        const wellnessRecords = records.filter(r => 
            r.hospital && r.hospital.toLowerCase().includes("ved aashram")
        );

        res.json({
            patientId,
            wellnessHistory: wellnessRecords.map(r => ({
                fileName: r.fileName,
                ipfsHash: r.ipfsHash,
                date: r.recordDate,
                hospital: r.hospital
            }))
        });
    } catch (error) {
        console.error("Wellness History Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Schedule a wellness retreat
 */
export const scheduleWellnessRetreat = async (req, res) => {
    try {
        const { patientId, startDate, endDate, program, location } = req.body;
        
        const patient = await getPatientByIdentifier(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const retreatData = JSON.stringify({
            type: "wellness_retreat",
            program,
            location,
            startDate,
            endDate
        });

        const accounts = await web3.eth.getAccounts();
        const ipfsHash = web3.utils.utf8ToHex(retreatData.substring(0, 32));

        const tx = await patientContract.methods.addMedicalRecord(
            ipfsHash,
            `Wellness Retreat - ${program}`,
            startDate,
            location || "Ved Aashram",
            true
        ).send({ from: accounts[0], gas: 300000 });

        res.json({
            status: "SUCCESS",
            transactionHash: tx.transactionHash,
            retreat: { startDate, endDate, program, location }
        });
    } catch (error) {
        console.error("Wellness Retreat Scheduling Error:", error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get wellness program recommendations based on patient history
 */
export const getWellnessRecommendations = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const patient = await getPatientByIdentifier(patientId);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }

        // Get patient vitals to provide personalized recommendations
        let vitals = null;
        try {
            vitals = await patientDetailsContract.methods.getVitals(patient.walletAddress).call();
        } catch (e) { /* vitals may not exist */ }

        const recommendations = [];

        // Basic recommendation logic
        if (vitals) {
            const bp = vitals.bloodPressure || "";
            if (bp.includes("/")) {
                const systolic = parseInt(bp.split("/")[0]);
                if (systolic > 130) {
                    recommendations.push({
                        program: "Stress Management & Meditation",
                        description: "Help lower blood pressure through guided meditation",
                        duration: "8 weeks"
                    });
                }
            }
        }

        // General wellness programs
        recommendations.push({
            program: "Yoga for Chronic Conditions",
            description: "Gentle yoga sequences for managing chronic health issues",
            duration: "12 weeks"
        });

        recommendations.push({
            program: "Detox & Rejuvenation Retreat",
            description: "Traditional Ayurvedic detox programs",
            duration: "7 days"
        });

        res.json({
            patientId,
            patientName: patient.name,
            vitals: vitals ? {
                bloodPressure: vitals.bloodPressure,
                heartRate: vitals.heartRate
            } : null,
            recommendations
        });
    } catch (error) {
        console.error("Wellness Recommendations Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Express router setup
router.post("/register", registerWellnessProvider);
router.post("/yoga-session", recordYogaSession);
router.get("/history/:patientId", wellnessCache, getWellnessHistory);
router.post("/retreat", scheduleWellnessRetreat);
router.get("/recommendations/:patientId", wellnessCache, getWellnessRecommendations);

export default router;
