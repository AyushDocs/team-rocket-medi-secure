import express from "express";
import { familyService } from "../services/familyService.js";
import { userService, vitalService, appointmentService, invoiceService } from "../services/database.js";

const router = express.Router();

router.post("/member", async (req, res) => {
    try {
        const { patientId, memberWallet, name, relationship, accessLevel, permissions } = req.body;

        if (!patientId || !memberWallet || !name || !relationship) {
            return res.status(400).json({ error: "patientId, memberWallet, name, relationship required" });
        }

        const member = await familyService.addMember(patientId, {
            memberWallet,
            name,
            relationship,
            accessLevel,
            ...permissions
        });

        res.status(201).json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/members/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const members = await familyService.getMembers(patientId);
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/member/:id", async (req, res) => {
    try {
        const { id } = req.params;
        await familyService.removeMember(id);
        res.json({ status: "removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch("/member/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, relationship, accessLevel, permissions } = req.body;

        const member = await familyService.updateMember(id, {
            ...(name && { name }),
            ...(relationship && { relationship }),
            ...(accessLevel && { accessLevel }),
            ...(permissions && {
                canViewRecords: permissions.canViewRecords,
                canAddVitals: permissions.canAddVitals,
                canBookAppointments: permissions.canBookAppointments,
                canViewBilling: permissions.canViewBilling,
                canManage: permissions.canManage,
                isEmergency: permissions.isEmergency
            })
        });

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/emergency/:patientId", async (req, res) => {
    try {
        const { patientId } = req.params;
        const contacts = await familyService.getEmergencyContacts(patientId);
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/accessible/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { type } = req.query;

        const accessible = await familyService.getAccessibleData(walletAddress, type || "records");
        res.json({ walletAddress, accessible });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/data/:walletAddress/:patientId/:dataType", async (req, res) => {
    try {
        const { walletAddress, patientId, dataType } = req.params;

        const authorized = await familyService.isAuthorized(walletAddress, patientId, dataType);
        
        if (!authorized) {
            return res.status(403).json({ error: "Access denied" });
        }

        const patient = await userService.findById(patientId);
        if (!patient?.patientData) {
            return res.status(404).json({ error: "Patient not found" });
        }

        let data;
        switch (dataType) {
            case "records":
                data = patient;
                break;
            case "vitals":
                data = await vitalService.findByPatient(patient.patientData.id, 50);
                break;
            case "appointments":
                data = await appointmentService.findByPatient(patient.patientData.id);
                break;
            case "billing":
                data = await invoiceService.findByPatient(patient.patientData.id);
                break;
            default:
                return res.status(400).json({ error: "Invalid data type" });
        }

        res.json({ patientId, dataType, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/vitals/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { patientId, ...vitals } = req.body;

        const authorized = await familyService.isAuthorized(walletAddress, patientId, "vitals");
        
        if (!authorized) {
            return res.status(403).json({ error: "Not authorized to add vitals" });
        }

        const vital = await vitalService.create(patientId, vitals);
        res.json(vital);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/appointments/:walletAddress", async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { patientId, doctorId, dateTime, ...rest } = req.body;

        const authorized = await familyService.isAuthorized(walletAddress, patientId, "appointments");
        
        if (!authorized) {
            return res.status(403).json({ error: "Not authorized to book appointments" });
        }

        const appointment = await appointmentService.create({
            patientId,
            doctorId,
            dateTime,
            ...rest
        });
        
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
