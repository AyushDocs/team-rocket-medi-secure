import express from "express";
import { syncQueue, queueOperation } from "../services/syncQueue.js";
import { getBlockchainStatus } from "../services/offlineSupport.js";

const router = express.Router();

router.get("/status", async (req, res) => {
    try {
        const bcStatus = getBlockchainStatus();
        const queueStatus = await syncQueue.getQueueStatus();
        
        res.json({
            blockchain: bcStatus,
            queue: queueStatus,
            canSync: bcStatus.healthy,
            offline: !bcStatus.healthy
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/queue/:operation", async (req, res) => {
    try {
        const { operation } = req.params;
        const payload = req.body;
        
        const bcStatus = getBlockchainStatus();
        
        if (bcStatus.healthy) {
            const result = await queueOperation(operation, payload);
            return res.json({ synced: true, result });
        }

        const queued = await syncQueue.add(operation, payload);
        res.json({ synced: false, queued: true, id: queued.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/retry", async (req, res) => {
    try {
        const result = await syncQueue.retryFailed();
        res.json({ retried: result.count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/clear", async (req, res) => {
    try {
        const result = await syncQueue.clearCompleted();
        res.json({ cleared: result.count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/pending", async (req, res) => {
    try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        
        const pending = await prisma.syncQueue.findMany({
            where: { status: { in: ["pending", "syncing", "failed"] } },
            orderBy: { createdAt: "asc" }
        });
        
        res.json(pending.map(p => ({
            id: p.id,
            operation: p.operation,
            status: p.status,
            attempts: p.attempts,
            error: p.error,
            createdAt: p.createdAt
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/force-sync", async (req, res) => {
    try {
        const bcStatus = getBlockchainStatus();
        
        if (!bcStatus.healthy) {
            return res.status(503).json({ error: "Blockchain unavailable" });
        }

        await syncQueue.processQueue();
        
        const status = await syncQueue.getQueueStatus();
        res.json({ status, synced: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
