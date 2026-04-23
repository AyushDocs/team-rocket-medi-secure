import express from "express";
import { messagingService } from "../services/messagingService.js";

const router = express.Router();

router.post("/telegram/send", async (req, res) => {
    try {
        const { chatId, message, options } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ error: "chatId and message required" });
        }

        const result = await messagingService.sendTelegram(chatId, message, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/whatsapp/send", async (req, res) => {
    try {
        const { to, message, template } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: "to and message required" });
        }

        const result = await messagingService.sendWhatsApp(to, message, template);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/emergency", async (req, res) => {
    try {
        const { contact, patientName, alertMessage } = req.body;

        if (!contact || !patientName || !alertMessage) {
            return res.status(400).json({ error: "contact, patientName, alertMessage required" });
        }

        const results = await messagingService.sendEmergencyAlert(contact, patientName, alertMessage);
        res.json({ sent: results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/appointment/reminder", async (req, res) => {
    try {
        const { contact, patientName, dateTime, doctorName } = req.body;

        if (!contact || !patientName || !dateTime || !doctorName) {
            return res.status(400).json({ error: "All fields required" });
        }

        await messagingService.sendAppointmentReminder(contact, patientName, dateTime, doctorName);
        res.json({ status: "sent" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/config", (req, res) => {
    res.json({
        telegram: !!process.env.TELEGRAM_BOT_TOKEN,
        whatsapp: !!process.env.WHATSAPP_FROM,
        providers: {
            telegram: process.env.TELEGRAM_BOT_TOKEN ? "configured" : "mock",
            whatsapp: process.env.WHATSAPP_FROM ? "configured" : "mock"
        }
    });
});

export default router;
