import express from "express";
import { doctorVerificationService } from "../services/doctorVerificationService.js";

const router = express.Router();

/**
 * @swagger
 * /doctor-verification/verify:
 *   post:
 *     summary: Submit doctor verification request
 *     tags: [Doctor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - licenseNumber
 *               - specialty
 *               - qualification
 *             properties:
 *               userId:
 *                 type: string
 *               licenseNumber:
 *                 type: string
 *               specialty:
 *                 type: string
 *               qualification:
 *                 type: string
 *               hospital:
 *                 type: string
 *               yearsExperience:
 *                 type: integer
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Verification submitted
 *       400:
 *         description: Missing required fields
 */
router.post("/verify", async (req, res) => {
    try {
        const { userId, licenseNumber, specialty, qualification, hospital, yearsExperience, documents } = req.body;

        if (!userId || !licenseNumber || !specialty || !qualification) {
            return res.status(400).json({ error: "userId, licenseNumber, specialty, qualification required" });
        }

        const result = await doctorVerificationService.submitVerification(userId, {
            licenseNumber,
            specialty,
            qualification,
            hospital,
            yearsExperience,
            documents
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/status/{userId}:
 *   get:
 *     summary: Get verification status for a doctor
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification status
 *       404:
 *         description: Verification not found
 */
router.get("/status/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const verification = await doctorVerificationService.getVerification(userId);

        if (!verification) {
            return res.status(404).json({ error: "Verification not found" });
        }

        res.json(verification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/all:
 *   get:
 *     summary: Get all verifications
 *     tags: [Doctor]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: List of verifications
 */
router.get("/all", async (req, res) => {
    try {
        const { status } = req.query;
        const verifications = await doctorVerificationService.getAllVerifications(status);
        res.json(verifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/approve/{userId}:
 *   patch:
 *     summary: Approve doctor verification
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verifiedBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification approved
 */
router.patch("/approve/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { verifiedBy } = req.body;

        const result = await doctorVerificationService.approveVerification(userId, verifiedBy);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/reject/{userId}:
 *   patch:
 *     summary: Reject doctor verification
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification rejected
 */
router.patch("/reject/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: "Rejection reason required" });
        }

        const result = await doctorVerificationService.rejectVerification(userId, reason);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/license/{licenseNumber}:
 *   get:
 *     summary: Find doctor by license number
 *     tags: [Doctor]
 *     parameters:
 *       - in: path
 *         name: licenseNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor verification info
 *       404:
 *         description: License not found
 */
router.get("/license/:licenseNumber", async (req, res) => {
    try {
        const { licenseNumber } = req.params;
        const doctor = await doctorVerificationService.findByLicense(licenseNumber);

        if (!doctor) {
            return res.status(404).json({ error: "License not found" });
        }

        res.json({
            verified: doctor.status === "verified",
            specialty: doctor.specialty,
            hospital: doctor.hospital
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /doctor-verification/stats:
 *   get:
 *     summary: Get verification statistics
 *     tags: [Doctor]
 *     responses:
 *       200:
 *         description: Verification stats
 */
router.get("/stats", async (req, res) => {
    try {
        const stats = await doctorVerificationService.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
