import express from "express";
import { 
    userService, 
    vitalService, 
    appointmentService, 
    prescriptionService,
    invoiceService,
    auditService 
} from "../services/database.js";
import { 
    getBlockchainStatus, 
    requireBlockchain, 
    syncPatientFromBlockchain,
    getPatientDataLocal,
    cachePatientData
} from "../services/offlineSupport.js";
import web3 from "../config/web3.js";
import { patientContract } from "../config/contracts.js";

const router = express.Router();

router.get("/health", (req, res) => {
    const bcStatus = getBlockchainStatus();
    res.json({
        status: bcStatus.healthy ? "healthy" : "degraded",
        blockchain: bcStatus,
        offline: !bcStatus.healthy,
        timestamp: new Date().toISOString()
    });
});

router.get("/status", (req, res) => {
    const bcStatus = getBlockchainStatus();
    res.json({
        blockchain: bcStatus,
        offline: !bcStatus.healthy,
        message: bcStatus.healthy 
            ? "All systems operational" 
            : "Running in offline mode - some features limited"
    });
});

router.post("/users", async (req, res) => {
    try {
        const { walletAddress, role, name, email, phone, dateOfBirth, bloodGroup } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({ error: "walletAddress required" });
        }

        const existing = await userService.findByWallet(walletAddress);
        if (existing) {
            return res.status(409).json({ error: "User already exists", user: existing });
        }

        const user = await userService.create({
            walletAddress,
            role: role || "patient",
            profile: { name, email, phone },
            patientData: { dateOfBirth, bloodGroup }
        });

        await auditService.log({ userId: user.id, action: "user_created", details: { role } });
        
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/users/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;
        
        let user = await userService.findByWallet(walletAddress);
        
        if (!user && getBlockchainStatus().healthy) {
            try {
                const patientId = await patientContract.methods.getPatientIdByUsername(walletAddress).call();
                if (patientId && patientId !== "0") {
                    user = await syncPatientFromBlockchain(patientId);
                }
            } catch (e) {
                console.warn("Blockchain lookup failed:", e.message);
            }
        }

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, bloodGroup, allergies, chronicConditions } = req.body;

        const user = await userService.update(id, {
            profile: { update: { name, email, phone, address } },
            patientData: { update: { bloodGroup, allergies, chronicConditions } }
        });

        await auditService.log({ userId: id, action: "user_updated", details: req.body });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/users", async (req, res) => {
    try {
        const { role } = req.query;
        const users = await userService.findAll(role);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/vitals", async (req, res) => {
    try {
        const { patientId, systolicBP, diastolicBP, heartRate, temperature, weight, height, oxygenSat, source } = req.body;

        if (!patientId || (!systolicBP && !heartRate)) {
            return res.status(400).json({ error: "patientId and at least one vital required" });
        }

        const vital = await vitalService.create(patientId, {
            systolicBP, diastolicBP, heartRate, temperature, weight, height, oxygenSat, source: source || "manual"
        });

        res.status(201).json(vital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/vitals/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { limit, source } = req.query;

        const vitals = await vitalService.findByPatient(patientId, parseInt(limit) || 100);
        
        const filtered = source 
            ? vitals.filter(v => v.source === source)
            : vitals;

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/vitals/:patientId/latest", async (req, res) => {
    try {
        const { patientId } = req.params;
        const vital = await vitalService.getLatest(patientId);
        
        if (!vital) {
            return res.status(404).json({ error: "No vitals found" });
        }

        res.json(vital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/vitals/:patientId/trends", async (req, res) => {
    try {
        const { patientId } = req.params;
        const { days } = req.query;

        const trends = await vitalService.getTrends(patientId, parseInt(days) || 30);
        res.json(trends);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/appointments", async (req, res) => {
    try {
        const { patientId, doctorId, dateTime, duration, type, notes, meetingLink } = req.body;

        if (!patientId || !doctorId || !dateTime) {
            return res.status(400).json({ error: "patientId, doctorId, dateTime required" });
        }

        const appointment = await appointmentService.create({
            patientId, doctorId, dateTime, duration, type, notes, meetingLink
        });

        await auditService.log({ 
            userId: patientId, 
            action: "appointment_created", 
            entityType: "appointment",
            entityId: appointment.id
        });

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/appointments/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const appointments = await appointmentService.findByPatient(patientId);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/appointments/doctor/:doctorId", async (req, res) => {
    try {
        const { doctorId } = req.params;
        const appointments = await appointmentService.findByDoctor(doctorId);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/appointments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes, meetingLink } = req.body;

        const appointment = await appointmentService.updateStatus(id, status);
        await auditService.log({ 
            action: "appointment_updated", 
            entityType: "appointment",
            entityId: id,
            details: { status, notes }
        });

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/prescriptions", async (req, res) => {
    try {
        const { patientId, doctorId, medications, diagnosis, notes } = req.body;

        if (!patientId || !doctorId || !medications) {
            return res.status(400).json({ error: "patientId, doctorId, medications required" });
        }

        const prescription = await prescriptionService.create({
            patientId, doctorId, medications, diagnosis, notes
        });

        res.status(201).json(prescription);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/prescriptions/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const prescriptions = await prescriptionService.findByPatient(patientId);
        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/invoices", async (req, res) => {
    try {
        const { patientId, amount, currency, dueDate, description, items } = req.body;

        if (!patientId || !amount) {
            return res.status(400).json({ error: "patientId and amount required" });
        }

        const invoice = await invoiceService.create({
            patientId, amount, currency, dueDate, description, items
        });

        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/invoices/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const invoices = await invoiceService.findByPatient(patientId);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/invoices/:id/pay", async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.markPaid(id);
        await auditService.log({ 
            action: "invoice_paid", 
            entityType: "invoice",
            entityId: id 
        });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/audit/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit } = req.query;
        const logs = await auditService.findByUser(userId, parseInt(limit) || 50);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/sync/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        
        if (!getBlockchainStatus().healthy) {
            return res.status(503).json({ 
                error: "Blockchain unavailable", 
                offline: true,
                message: "Cannot sync - blockchain offline"
            });
        }

        const user = await syncPatientFromBlockchain(patientId);
        
        if (!user) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json({ status: "synced", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/cache/patient/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await cachePatientData(patientId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/patient/:patientId/local", async (req, res) => {
    try {
        const { patientId } = req.params;
        const data = await getPatientDataLocal(patientId);
        
        if (!data) {
            return res.status(404).json({ error: "Patient not found" });
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
