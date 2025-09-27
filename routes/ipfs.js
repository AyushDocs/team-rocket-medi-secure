import express from "express";
import {
    createPatient,
    updatePatientRecord,
    readPatientHistory,
} from "../ipfs/index.js";

const router = express.Router();

router.post("/create-patient", async (req, res) => {
    const { walletAddress, metadata } = req.body;
    try {
        const cid = await createPatient(walletAddress, metadata);
        res.status(200).json({ success: true, cid });
    } catch (error) {
        console.error("Error creating patient:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put("/update-patient", async (req, res) => {
    const { walletAddress, updatedFields } = req.body;
    try {
        const newCID = await updatePatientRecord(walletAddress, updatedFields);
        res.status(200).json({ success: true, newCID });
    } catch (error) {
        console.error("Error updating patient record:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get("/read-history", async (req, res) => {
    const { walletAddress } = req.query;
    try {
        const history = await readPatientHistory(walletAddress);
        res.status(200).json({ success: true, history });
    } catch (error) {
        console.error("Error reading patient history:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
