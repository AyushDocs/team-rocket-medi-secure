import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const db = prisma;

export const userService = {
    async findByWallet(walletAddress) {
        return prisma.user.findUnique({
            where: { walletAddress: walletAddress.toLowerCase() },
            include: { profile: true, patientData: true, doctorData: true },
        });
    },

    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: { profile: true, patientData: true, doctorData: true },
        });
    },

    async create(data) {
        return prisma.user.create({
            data: {
                walletAddress: data.walletAddress.toLowerCase(),
                role: data.role || "patient",
                profile: data.profile ? { create: data.profile } : undefined,
                patientData: data.patientData ? { create: data.patientData } : undefined,
                doctorData: data.doctorData ? { create: data.doctorData } : undefined,
            },
            include: { profile: true, patientData: true, doctorData: true },
        });
    },

    async update(id, data) {
        return prisma.user.update({
            where: { id },
            data,
            include: { profile: true, patientData: true, doctorData: true },
        });
    },

    async findAll(role) {
        return prisma.user.findMany({
            where: role ? { role } : undefined,
            include: { profile: true },
        });
    },
};

export const vitalService = {
    async create(patientId, data) {
        return prisma.vitalRecord.create({
            data: {
                patientId,
                systolicBP: data.systolicBP,
                diastolicBP: data.diastolicBP,
                heartRate: data.heartRate,
                temperature: data.temperature,
                weight: data.weight,
                height: data.height,
                oxygenSat: data.oxygenSat,
                source: data.source || "manual",
                transactionHash: data.transactionHash,
            },
        });
    },

    async findByPatient(patientId, limit = 100) {
        return prisma.vitalRecord.findMany({
            where: { patientId },
            orderBy: { recordedAt: "desc" },
            take: limit,
        });
    },

    async getLatest(patientId) {
        return prisma.vitalRecord.findFirst({
            where: { patientId },
            orderBy: { recordedAt: "desc" },
        });
    },

    async getTrends(patientId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return prisma.vitalRecord.findMany({
            where: {
                patientId,
                recordedAt: { gte: startDate },
            },
            orderBy: { recorded: "asc" },
        });
    },
};

export const appointmentService = {
    async create(data) {
        return prisma.appointment.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                dateTime: new Date(data.dateTime),
                duration: data.duration || 30,
                type: data.type,
                notes: data.notes,
                meetingLink: data.meetingLink,
            },
            include: { patient: true, doctor: true },
        });
    },

    async findByPatient(patientId) {
        return prisma.appointment.findMany({
            where: { patientId },
            include: { doctor: { include: { user: { include: { profile: true } } } } },
            orderBy: { dateTime: "asc" },
        });
    },

    async findByDoctor(doctorId) {
        return prisma.appointment.findMany({
            where: { doctorId },
            include: { patient: { include: { user: { include: { profile: true } } } } },
            orderBy: { dateTime: "asc" },
        });
    },

    async updateStatus(id, status) {
        return prisma.appointment.update({
            where: { id },
            data: { status },
        });
    },
};

export const prescriptionService = {
    async create(data) {
        return prisma.prescription.create({
            data: {
                patientId: data.patientId,
                doctorId: data.doctorId,
                medications: JSON.stringify(data.medications),
                diagnosis: data.diagnosis,
                notes: data.notes,
            },
            include: { patient: true, doctor: true },
        });
    },

    async findByPatient(patientId) {
        return prisma.prescription.findMany({
            where: { patientId },
            include: { doctor: { include: { user: { include: { profile: true } } } } },
            orderBy: { date: "desc" },
        });
    },
};

export const invoiceService = {
    async create(data) {
        return prisma.invoice.create({
            data: {
                patientId: data.patientId,
                amount: data.amount,
                currency: data.currency || "INR",
                dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                description: data.description,
                items: data.items ? JSON.stringify(data.items) : undefined,
            },
        });
    },

    async findByPatient(patientId) {
        return prisma.invoice.findMany({
            where: { patientId },
            orderBy: { dueDate: "asc" },
        });
    },

    async markPaid(id) {
        return prisma.invoice.update({
            where: { id },
            data: { status: "paid", paidAt: new Date() },
        });
    },
};

export const auditService = {
    async log(data) {
        return prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                details: data.details ? JSON.stringify(data.details) : undefined,
                ipAddress: data.ipAddress,
            },
        });
    },

    async findByUser(userId, limit = 50) {
        return prisma.auditLog.findMany({
            where: { userId },
            orderBy: { timestamp: "desc" },
            take: limit,
        });
    },
};

export const apiKeyService = {
    async create(data) {
        const key = `sk_${crypto.randomUUID().replace(/-/g, "")}`;
        return prisma.apiKey.create({
            data: {
                key,
                name: data.name,
                userId: data.userId,
                permissions: data.permissions,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            },
        });
    },

    async validate(key) {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key },
        });

        if (!apiKey) return null;
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

        await prisma.apiKey.update({
            where: { key },
            data: { lastUsed: new Date() },
        });

        return apiKey;
    },

    async revoke(key) {
        return prisma.apiKey.delete({ where: { key } });
    },
};

export default {
    db,
    userService,
    vitalService,
    appointmentService,
    prescriptionService,
    invoiceService,
    auditService,
    apiKeyService,
};
