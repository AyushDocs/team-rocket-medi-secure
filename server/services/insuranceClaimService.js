import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const insuranceClaimService = {
    async create(data) {
        const claimNumber = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        return prisma.insuranceClaim.create({
            data: {
                patientId: data.patientId,
                invoiceId: data.invoiceId,
                claimNumber,
                amount: data.amount,
                currency: data.currency || "INR",
                type: data.type || "reimbursement",
                description: data.description,
                documents: data.documents ? JSON.stringify(data.documents) : null,
                status: "submitted"
            },
            include: {
                patient: { include: { user: { include: { profile: true } } } },
                invoice: true
            }
        });
    },

    async findByPatient(patientId) {
        return prisma.insuranceClaim.findMany({
            where: { patientId },
            orderBy: { submittedAt: "desc" }
        });
    },

    async findById(id) {
        return prisma.insuranceClaim.findUnique({
            where: { id },
            include: {
                patient: { include: { user: { include: { profile: true } } } },
                invoice: true
            }
        });
    },

    async updateStatus(id, status, data = {}) {
        const updateData = { status };
        
        if (status === "under_review") {
            updateData.reviewedAt = new Date();
        }
        if (status === "approved") {
            updateData.approvedAt = new Date();
            updateData.approvedBy = data.approvedBy;
        }
        if (status === "rejected") {
            updateData.rejectionReason = data.rejectionReason;
        }
        if (status === "paid") {
            updateData.paidAt = new Date();
            updateData.paymentRef = data.paymentRef;
        }

        return prisma.insuranceClaim.update({
            where: { id },
            data: updateData,
            include: {
                patient: { include: { user: { include: { profile: true } } } }
            }
        });
    },

    async getAll(status = null, limit = 50) {
        return prisma.insuranceClaim.findMany({
            where: status ? { status } : undefined,
            orderBy: { submittedAt: "desc" },
            take: limit,
            include: {
                patient: { include: { user: { include: { profile: true } } } }
            }
        });
    },

    async getStats() {
        const total = await prisma.insuranceClaim.count();
        const submitted = await prisma.insuranceClaim.count({ where: { status: "submitted" } });
        const underReview = await prisma.insuranceClaim.count({ where: { status: "under_review" } });
        const approved = await prisma.insuranceClaim.count({ where: { status: "approved" } });
        const rejected = await prisma.insuranceClaim.count({ where: { status: "rejected" } });
        const paid = await prisma.insuranceClaim.count({ where: { status: "paid" } });

        const amountResult = await prisma.insuranceClaim.aggregate({
            _sum: { amount: true }
        });

        return {
            total,
            byStatus: { submitted, underReview, approved, rejected, paid },
            totalAmount: amountResult._sum.amount || 0
        };
    }
};

export default insuranceClaimService;
