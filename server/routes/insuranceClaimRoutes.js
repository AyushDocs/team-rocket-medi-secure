import express from "express";
import { insuranceClaimService } from "../services/insuranceClaimService.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { patientId, invoiceId, amount, currency, type, description, documents } = req.body;

        if (!patientId || !amount) {
            return res.status(400).json({ error: "patientId and amount required" });
        }

        const claim = await insuranceClaimService.create({
            patientId, invoiceId, amount, currency, type, description, documents
        });

        res.status(201).json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const claims = await insuranceClaimService.findByPatient(patientId);
        res.json(claims);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const claim = await insuranceClaimService.findById(id);

        if (!claim) {
            return res.status(404).json({ error: "Claim not found" });
        }

        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approvedBy, rejectionReason, paymentRef } = req.body;

        const validStatuses = ["submitted", "under_review", "approved", "rejected", "paid"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const claim = await insuranceClaimService.updateStatus(id, status, {
            approvedBy,
            rejectionReason,
            paymentRef
        });

        res.json(claim);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const { status, limit } = req.query;
        const claims = await insuranceClaimService.getAll(status, parseInt(limit) || 50);
        res.json(claims);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/stats/overview", async (req, res) => {
    try {
        const stats = await insuranceClaimService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
