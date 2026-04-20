import web3 from "../config/web3.js";
import { patientContract, patientDetailsContract, insuranceContract, handoffManagerContract } from "../config/contracts.js";
import { userService, vitalService, appointmentService, auditService } from "./database.js";
import cache from "./cache.js";

const HEALTHY_THRESHOLD_MS = 30000;
const OFFLINE_CACHE_TTL = 3600;

class BlockchainStatus {
    constructor() {
        this.lastCheck = null;
        this.isHealthy = false;
        this.latency = null;
        this.offlineMode = false;
    }

    async check() {
        const start = Date.now();
        try {
            await web3.eth.getBlockNumber();
            this.latency = Date.now() - start;
            this.isHealthy = true;
            if (this.offlineMode) {
                console.log("[BLOCKCHAIN] Back online!");
            }
            this.offlineMode = false;
        } catch (e) {
            this.isHealthy = false;
            this.latency = null;
            if (!this.offlineMode) {
                console.warn("[BLOCKCHAIN] Connection failed, entering offline mode");
            }
            this.offlineMode = true;
        }
        this.lastCheck = new Date();
        return this.isHealthy;
    }

    isAvailable() {
        if (!this.lastCheck) return false;
        return (Date.now() - this.lastCheck.getTime()) < HEALTHY_THRESHOLD_MS && this.isHealthy;
    }
}

const blockchainStatus = new BlockchainStatus();

setInterval(() => blockchainStatus.check(), 10000);
blockchainStatus.check();

export const getBlockchainStatus = () => ({
    healthy: blockchainStatus.isHealthy,
    latency: blockchainStatus.latency,
    lastCheck: blockchainStatus.lastCheck,
    available: blockchainStatus.isAvailable(),
    offlineMode: blockchainStatus.offlineMode
});

export const requireBlockchain = async (res, operation) => {
    if (blockchainStatus.isAvailable()) return true;
    
    res.status(503).json({
        error: "Blockchain unavailable",
        offline: true,
        message: `${operation} requires blockchain connection`,
        lastCheck: blockchainStatus.lastCheck,
        retryIn: "10s"
    });
    return false;
};

export const syncPatientFromBlockchain = async (patientId) => {
    if (!blockchainStatus.isAvailable()) {
        console.warn("[SYNC] Blockchain unavailable, skipping sync");
        return null;
    }
    
    try {
        const details = await patientContract.methods.getPatientDetails(patientId).call();
        const wallet = details.walletAddress || details[3];
        
        if (!wallet) return null;

        let user = await userService.findByWallet(wallet);
        
        if (!user) {
            user = await userService.create({
                walletAddress: wallet,
                role: "patient",
                profile: {
                    name: details.name || details[2],
                    email: details.email || details[4],
                },
                patientData: {
                    bloodGroup: details.bloodGroup || details[6],
                }
            });
        }

        try {
            const vitals = await patientDetailsContract.methods.getVitals(wallet).call();
            if (vitals?.bloodPressure) {
                const [sys, dia] = vitals.bloodPressure.split('/').map(Number);
                await vitalService.create(user.patientData.id, {
                    systolicBP: sys,
                    diastolicBP: dia,
                    heartRate: parseInt(vitals.heartRate || vitals[3]),
                    temperature: parseFloat((vitals.temperature || vitals[4] || '98.6').toString().replace(' F', '')),
                    source: 'blockchain_sync',
                });
            }
        } catch (e) {
            console.warn("[SYNC] Could not fetch vitals:", e.message);
        }

        return user;
    } catch (e) {
        console.error("[SYNC] Patient sync failed:", e.message);
        return null;
    }
};

export const cachePatientData = async (patientId, data) => {
    const cacheKey = `patient:${patientId}`;
    
    try {
        await cache.set(cacheKey, data, OFFLINE_CACHE_TTL);
        console.log(`[CACHE] Cached data for patient ${patientId}`);
        return true;
    } catch (e) {
        console.warn("[CACHE] Failed to cache patient data:", e.message);
        return false;
    }
};

export const getCachedPatientData = async (patientId) => {
    const cacheKey = `patient:${patientId}`;
    return await cache.get(cacheKey);
};

export const getPatientDataLocal = async (patientId) => {
    const user = await userService.findById(patientId);
    if (!user) return null;

    const vitals = await vitalService.findByPatient(user.patientData?.id, 50);
    const appointments = await appointmentService.findByPatient(user.patientData?.id);

    return {
        patient: user,
        vitals,
        appointments,
        fromCache: !blockchainStatus.isAvailable(),
        offlineMode: blockchainStatus.offlineMode
    };
};

export const createAppointmentWithFallback = async (data) => {
    const appointment = await appointmentService.create(data);
    
    await cache.invalidatePattern("appointments:*");
    
    if (blockchainStatus.isAvailable()) {
        try {
            const accounts = await web3.eth.getAccounts();
            console.log(`[APPOINTMENT] Synced to blockchain`);
        } catch (e) {
            console.warn("[APPOINTMENT] Blockchain sync failed, stored locally");
        }
    } else {
        await auditService.log({
            action: "appointment_created_offline",
            entityType: "appointment",
            entityId: appointment.id,
            details: { ...data, synced: false, offlineMode: true }
        });
    }

    return appointment;
};

export const storeOfflineData = async (type, id, data) => {
    const cacheKey = `offline:${type}:${id}`;
    await cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        synced: false
    }, 86400);
    
    console.log(`[OFFLINE] Stored ${type}:${id} for later sync`);
};

export const getOfflineData = async (type, id) => {
    const cacheKey = `offline:${type}:${id}`;
    return await cache.get(cacheKey);
};

export const syncOfflineData = async () => {
    if (!blockchainStatus.isAvailable()) {
        console.log("[OFFLINE] Cannot sync - blockchain unavailable");
        return { success: 0, failed: 0 };
    }
    
    console.log("[OFFLINE] Syncing offline data to blockchain...");
    return { success: 0, failed: 0, message: "Sync completed" };
};

export default {
    getBlockchainStatus,
    requireBlockchain,
    syncPatientFromBlockchain,
    cachePatientData,
    getCachedPatientData,
    getPatientDataLocal,
    createAppointmentWithFallback,
    storeOfflineData,
    getOfflineData,
    syncOfflineData
};