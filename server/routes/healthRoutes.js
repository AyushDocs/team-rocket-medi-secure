import express from "express";
import { generateHealthInsights, getVitalsForecast } from "../services/healthInsights.js";

const router = express.Router();

router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const insights = await generateHealthInsights(patientId);
        
        if (!insights) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId/forecast", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { days } = req.query;
        
        const forecast = await getVitalsForecast(patientId, parseInt(days) || 7);
        
        if (!forecast) {
            return res.status(404).json({ error: "Patient not found or insufficient data" });
        }

        res.json(forecast);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/ranges", (req, res) => {
    res.json({
        bloodPressure: {
            normal: { systolic: "90-120", diastolic: "60-80" },
            elevated: { systolic: "120-140", diastolic: "80-90" },
            critical: { systolic: ">140 or <90", diastolic: ">90 or <50" }
        },
        heartRate: {
            normal: "60-100 bpm",
            low: "< 40 bpm",
            high: "> 120 bpm"
        },
        temperature: {
            normal: "97-99°F",
            fever: "> 101°F",
            critical: "> 103°F"
        },
        oxygenSat: {
            normal: "95-100%",
            low: "< 90%"
        }
    });
});

export default router;
