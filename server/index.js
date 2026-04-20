import cors from "cors";
import express from "express";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";
import { CONFIG } from "./config/constants.js";
import { swaggerSpec, swaggerOptions } from "./config/swagger.js";
import { requestIdMiddleware, errorHandler as requestIdErrorHandler } from "./middleware/requestId.js";
import cache from "./services/cache.js";
import computeRoutes from "./routes/computeRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import handoffRoutes from "./routes/handoffRoutes.js";
import insuranceRoutes from "./routes/insuranceRoutes.js";
import wellnessRoutes from "./routes/wellnessRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import dbRoutes from "./routes/dbRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import insuranceClaimRoutes from "./routes/insuranceClaimRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import messagingRoutes from "./routes/messagingRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import doctorVerificationRoutes from "./routes/doctorVerificationRoutes.js";
import custodianRoutes from "./routes/custodianRoutes.js";
import { initializeSocket } from "./services/socketService.js";
import { initializeIoT } from "./services/iotService.js";
import { initializeContracts, getContractStatus, areContractsReady } from "./config/contracts.js";
import { getBlockchainStatus } from "./services/offlineSupport.js";
import { migrationManager } from "./services/migration.js";
import { generalLimiter, helmetMiddleware } from "./middleware/security.js";
import { getRateLimiterStatus } from "./services/rateLimiter.js";
import { errorHandler } from "./middleware/requestId.js";
import { sanitizeInput } from "./middleware/validation.js";
import { getAllBreakerStatus } from "./services/circuitBreaker.js";
import { requestLogger, securityLogger } from "./middleware/logger.js";
import { responseWrapper, createSuccessResponse } from "./middleware/responseWrapper.js";
import versionMiddleware, { getVersionInfo } from "./middleware/versioning/index.js";
import { featureFlags } from "./services/featureFlags.js";
import { metricsMiddleware, prometheusMetrics } from "./middleware/metrics.js";
import { getMetrics } from "./services/metrics.js";
import logger from "./services/logger.js";
import { connect as connectRateLimiter } from "./services/rateLimiter.js";

const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"];

BigInt.prototype.toJSON = function() { return this.toString() }

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGINS, 
    methods: ["GET", "POST"],
  },
});

app.use(compression());
app.use(helmetMiddleware);
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestIdMiddleware);
app.use(versionMiddleware);
app.use(sanitizeInput);
app.use(responseWrapper);
app.use(metricsMiddleware);
app.use(requestLogger);
app.use(securityLogger);
app.use(generalLimiter);
initializeSocket(io);
initializeIoT().catch(err => logger.error("IoT Init Fallback:", err));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use("/api-docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api/v1/files", fileRoutes);
app.use("/api/v1/compute", computeRoutes);
app.use("/api/v1/emergency", emergencyRoutes);
app.use("/api/v1/patient", patientRoutes);
app.use("/api/v1/handoff", handoffRoutes);
app.use("/api/v1/insurance", insuranceRoutes);
app.use("/api/v1/wellness", wellnessRoutes);
app.use("/api/v1/marketplace", marketplaceRoutes);
app.use("/api/v1/db", dbRoutes);
app.use("/api/v1/sync", syncRoutes);
app.use("/api/v1/export", exportRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/pdf", pdfRoutes);
app.use("/api/v1/claims", insuranceClaimRoutes);
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/messaging", messagingRoutes);
app.use("/api/v1/family", familyRoutes);
app.use("/api/v1/doctor-verification", doctorVerificationRoutes);
app.use("/api/v1/custodian", custodianRoutes);

app.get("/health", (req, res) => {
    const contractsReady = areContractsReady();
    const status = getContractStatus();
    const bcStatus = getBlockchainStatus();
    const cacheStatus = cache.getStatus();
    const rateLimitStatus = getRateLimiterStatus();
    const circuitBreakers = getAllBreakerStatus();
    const featureStatus = featureFlags.getAll();
    const metricsData = getMetrics();
    
    const allLoaded = Object.values(status).every(s => s.loaded);
    const allBreakersClosed = circuitBreakers.every(b => b.state === "closed");
    
    const isHealthy = allLoaded && bcStatus.healthy && allBreakersClosed;
    
    res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "healthy" : "degraded",
        serviceId: CONFIG.SERVICE_ID,
        serviceName: CONFIG.SERVICE_NAME,
        version: CONFIG.VERSION,
        timestamp: new Date().toISOString(),
        checks: {
            contracts: { loaded: allLoaded, details: status },
            blockchain: bcStatus,
            cache: cacheStatus,
            rateLimiter: rateLimitStatus,
            circuitBreakers: { closed: allBreakersClosed, details: circuitBreakers }
        },
        features: featureStatus,
        metrics: {
            uptime: metricsData.system.process.uptime,
            memory: metricsData.system.process.memory
        }
    });
});

app.get("/cache/status", (req, res) => {
    res.json(cache.getStatus());
});

app.post("/cache/clear", (req, res) => {
    cache.clearMemoryCache();
    res.json({ success: true, message: "Memory cache cleared" });
});

app.get("/migrations/status", async (req, res) => {
    const status = await migrationManager.status();
    res.json(status);
});

app.post("/migrations/run", async (req, res) => {
    try {
        const result = await migrationManager.runMigrations();
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/", (req, res) => {
    const status = getContractStatus();
    const bcStatus = getBlockchainStatus();
    const allLoaded = Object.values(status).every(s => s.loaded);
    const versionInfo = getVersionInfo();
    
    res.json({ 
        message: "MediSecure API is running",
        serviceId: CONFIG.SERVICE_ID,
        serviceName: CONFIG.SERVICE_NAME,
        version: CONFIG.VERSION,
        apiVersion: versionInfo.current,
        supportedVersions: versionInfo.supported,
        offlineMode: bcStatus.offlineMode,
        status: !bcStatus.healthy ? "offline_mode" : "operational",
        blockchain: bcStatus.healthy ? "connected" : "disconnected",
        endpoints: {
            health: "/health",
            docs: "/api-docs",
            api: "/api/v1",
            db: "/api/v1/db",
            patient: "/api/v1/patient",
            emergency: "/api/v1/emergency"
        }
    });
});

app.get("/api-version", (req, res) => {
    const versionInfo = getVersionInfo();
    res.json(versionInfo);
});

app.get("/features", (req, res) => {
    res.json(featureFlags.getAll());
});

app.post("/features/:flag", (req, res) => {
    const { flag } = req.params;
    const { enabled } = req.body;
    
    if (enabled === undefined) {
        return res.status(400).json({ error: "Missing 'enabled' parameter" });
    }
    
    featureFlags.set(flag, enabled);
    res.json({ success: true, flag, enabled: featureFlags.isEnabled(flag) });
});

app.get("/metrics", (req, res) => {
    res.json(getMetrics());
});

app.get("/metrics/prometheus", prometheusMetrics);

initializeContracts();
cache.connect();
connectRateLimiter();

app.use(requestIdErrorHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    (async () => {
        try {
            const migrationStatus = await migrationManager.runMigrations();
            logger.info(`[${CONFIG.SERVICE_ID}] Migrations: ${migrationStatus.applied.length} applied`);
        } catch (err) {
            logger.warn(`[${CONFIG.SERVICE_ID}] Migration check skipped: ${err.message}`);
        }
        
        httpServer.listen(CONFIG.PORT, () => {
            logger.info(`[${CONFIG.SERVICE_ID}] Server running on port ${CONFIG.PORT}`);
            logger.info(`[${CONFIG.SERVICE_ID}] API Docs available at http://localhost:${CONFIG.PORT}/api-docs`);
            logger.info(`[${CONFIG.SERVICE_ID}] Cache mode: ${cache.getStatus().mode}`);
        });
    })();
}

export default app;