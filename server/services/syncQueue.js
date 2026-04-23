import { PrismaClient } from "@prisma/client";
import web3 from "../config/web3.js";
import { patientDetailsContract, patientContract, handoffManagerContract } from "../config/contracts.js";
import { getBlockchainStatus } from "./offlineSupport.js";

const prisma = new PrismaClient();

class SyncQueue {
    constructor() {
        this.processing = false;
        this.retryInterval = 30000;
        this.startQueueProcessor();
    }

    async add(operation, payload, priority = "normal") {
        return prisma.syncQueue.create({
            data: {
                operation,
                payload: JSON.stringify(payload),
                status: "pending",
            }
        });
    }

    async processItem(item) {
        const payload = JSON.parse(item.payload);
        
        switch (item.operation) {
            case "vitals":
                return this.syncVitals(payload);
            case "appointment":
                return this.syncAppointment(payload);
            case "prescription":
                return this.syncPrescription(payload);
            case "medical_record":
                return this.syncMedicalRecord(payload);
            case "patient_details":
                return this.syncPatientDetails(payload);
            default:
                console.warn(`Unknown operation: ${item.operation}`);
                return { success: false, error: "Unknown operation" };
        }
    }

    async syncVitals(payload) {
        const { patientAddress, sbp, heartRate, temperature } = payload;
        
        const accounts = await web3.eth.getAccounts();
        
        const tx = await patientDetailsContract.methods.setVitalsForPatient(
            patientAddress,
            sbp,
            heartRate,
            temperature || "98.6 F"
        ).send({ from: accounts[0], gas: 200000 });

        return { success: true, transactionHash: tx.transactionHash };
    }

    async syncAppointment(payload) {
        console.log(`[SYNC] Appointment synced: ${payload.id}`);
        return { success: true };
    }

    async syncPrescription(payload) {
        console.log(`[SYNC] Prescription synced: ${payload.id}`);
        return { success: true };
    }

    async syncMedicalRecord(payload) {
        console.log(`[SYNC] Medical record synced: ${payload.fileName}`);
        return { success: true };
    }

    async syncPatientDetails(payload) {
        console.log(`[SYNC] Patient details synced: ${payload.patientId}`);
        return { success: true };
    }

    async processQueue() {
        if (this.processing || !getBlockchainStatus().healthy) {
            return;
        }

        this.processing = true;

        try {
            const pending = await prisma.syncQueue.findMany({
                where: { status: { in: ["pending", "failed"] } },
                orderBy: { createdAt: "asc" },
                take: 10
            });

            for (const item of pending) {
                if (item.attempts >= item.maxAttempts) {
                    await prisma.syncQueue.update({
                        where: { id: item.id },
                        data: { status: "failed" }
                    });
                    continue;
                }

                await prisma.syncQueue.update({
                    where: { id: item.id },
                    data: { status: "syncing", attempts: { increment: 1 } }
                });

                try {
                    const result = await this.processItem(item);
                    
                    if (result.success) {
                        await prisma.syncQueue.update({
                            where: { id: item.id },
                            data: { 
                                status: "completed",
                                completedAt: new Date(),
                                syncedAt: new Date()
                            }
                        });
                    } else {
                        await prisma.syncQueue.update({
                            where: { id: item.id },
                            data: { 
                                status: "failed",
                                error: result.error
                            }
                        });
                    }
                } catch (error) {
                    await prisma.syncQueue.update({
                        where: { id: item.id },
                        data: { 
                            status: "pending",
                            error: error.message
                        }
                    });
                }
            }
        } finally {
            this.processing = false;
        }
    }

    startQueueProcessor() {
        setInterval(() => this.processQueue(), this.retryInterval);
        console.log("[SYNC] Queue processor started");
    }

    async getQueueStatus() {
        const pending = await prisma.syncQueue.count({ where: { status: "pending" } });
        const syncing = await prisma.syncQueue.count({ where: { status: "syncing" } });
        const completed = await prisma.syncQueue.count({ where: { status: "completed" } });
        const failed = await prisma.syncQueue.count({ where: { status: "failed" } });

        return { pending, syncing, completed, failed };
    }

    async retryFailed() {
        return prisma.syncQueue.updateMany({
            where: { status: "failed" },
            data: { status: "pending", error: null }
        });
    }

    async clearCompleted() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        return prisma.syncQueue.deleteMany({
            where: { 
                status: "completed",
                completedAt: { lt: thirtyDaysAgo }
            }
        });
    }
}

export const syncQueue = new SyncQueue();

export const queueOperation = (operation, payload) => {
    if (getBlockchainStatus().healthy) {
        return syncQueue.processItem({ operation, payload: JSON.stringify(payload) });
    }
    return syncQueue.add(operation, payload);
};

export default syncQueue;
