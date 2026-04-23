import express from "express";
import { notificationService } from "../services/notificationService.js";

const router = express.Router();

router.post("/email", async (req, res) => {
    try {
        const { to, subject, body, templateId } = req.body;

        if (!to || !subject || !body) {
            return res.status(400).json({ error: "to, subject, body required" });
        }

        const result = await notificationService.sendEmail(to, subject, body, templateId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/sms", async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: "to, message required" });
        }

        const result = await notificationService.sendSMS(to, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/push", async (req, res) => {
    try {
        const { userId, title, body, data } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({ error: "userId, title, body required" });
        }

        const result = await notificationService.sendPush(userId, title, body, data);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/appointment/reminder", async (req, res) => {
    try {
        const { appointment, patient, doctor } = req.body;

        if (!appointment || !patient || !doctor) {
            return res.status(400).json({ error: "appointment, patient, doctor required" });
        }

        await notificationService.appointmentReminder(appointment, patient, doctor);
        res.json({ status: "sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/emergency/alert", async (req, res) => {
    try {
        const { patient, alert } = req.body;

        if (!patient || !alert) {
            return res.status(400).json({ error: "patient, alert required" });
        }

        await notificationService.emergencyAlert(patient, alert);
        res.json({ status: "sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/config", (req, res) => {
    res.json({
        email: process.env.EMAIL_ENABLED === "true",
        sms: process.env.SMS_ENABLED === "true",
        push: true
    });
});

export default router;
