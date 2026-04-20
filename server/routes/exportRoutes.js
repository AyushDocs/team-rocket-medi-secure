import express from "express";
import { exportToJSON, exportToCSV, generatePatientSummary } from "../services/exportService.js";
import { userService } from "../services/database.js";

const router = express.Router();

router.get("/patient/:patientId/json", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { download } = req.query;

        const data = await exportToJSON(patientId);
        
        if (!data) {
            return res.status(404).json({ error: "Patient not found" });
        }

        if (download === 'true') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=patient-${patientId}-export.json`);
            return res.json(data);
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId/csv", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { type } = req.query;

        const validTypes = ['vitals', 'appointments', 'prescriptions', 'invoices'];
        const dataType = validTypes.includes(type) ? type : 'vitals';

        const csv = await exportToCSV(patientId, dataType);
        
        if (!csv) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=patient-${patientId}-${dataType}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId/summary", async (req, res) => {
    try {
        const { patientId } = req.params;

        const summary = await generatePatientSummary(patientId);
        
        if (!summary) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId/all", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { format } = req.query;

        const user = await userService.findById(patientId);
        if (!user) {
            return res.status(404).json({ error: "Patient not found" });
        }

        const jsonData = await exportToJSON(patientId);
        
        if (format === 'csv') {
            const csv = await exportToCSV(patientId, 'vitals');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=patient-${patientId}-complete.csv`);
            return res.send(csv);
        }

        res.json(jsonData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
