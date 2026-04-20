import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const doctorVerificationService = {
    async submitVerification(userId, data) {
        const existing = await prisma.doctorVerification.findUnique({
            where: { userId }
        });

        if (existing && existing.status === "verified") {
            throw new Error("Doctor already verified");
        }

        return prisma.doctorVerification.upsert({
            where: { userId },
            create: {
                userId,
                licenseNumber: data.licenseNumber,
                specialty: data.specialty,
                qualification: data.qualification,
                hospital: data.hospital,
                yearsExperience: data.yearsExperience,
                documents: data.documents ? JSON.stringify(data.documents) : null,
                status: "pending"
            },
            update: {
                licenseNumber: data.licenseNumber,
                specialty: data.specialty,
                qualification: data.qualification,
                hospital: data.hospital,
                yearsExperience: data.yearsExperience,
                documents: data.documents ? JSON.stringify(data.documents) : null,
                status: "pending"
            }
        });
    },

    async getVerification(userId) {
        return prisma.doctorVerification.findUnique({
            where: { userId }
        });
    },

    async getAllVerifications(status = null) {
        return prisma.doctorVerification.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: "desc" },
            include: { user: { include: { profile: true } } }
        });
    },

    async approveVerification(userId, verifiedBy) {
        return prisma.doctorVerification.update({
            where: { userId },
            data: {
                status: "verified",
                verifiedAt: new Date(),
                verifiedBy
            }
        });
    },

    async rejectVerification(userId, reason) {
        return prisma.doctorVerification.update({
            where: { userId },
            data: {
                status: "rejected",
                rejectionReason: reason
            }
        });
    },

    async isVerified(userId) {
        const verification = await prisma.doctorVerification.findUnique({
            where: { userId }
        });
        return verification?.status === "verified";
    },

    async findByLicense(licenseNumber) {
        return prisma.doctorVerification.findUnique({
            where: { licenseNumber }
        });
    },

    async getStats() {
        const pending = await prisma.doctorVerification.count({ where: { status: "pending" } });
        const verified = await prisma.doctorVerification.count({ where: { status: "verified" } });
        const rejected = await prisma.doctorVerification.count({ where: { status: "rejected" } });

        return { pending, verified, rejected, total: pending + verified + rejected };
    }
};

export default doctorVerificationService;
