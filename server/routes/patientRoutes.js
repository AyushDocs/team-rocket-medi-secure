import express from "express"; 
import { 
    syncVitals,
    syncAlert,
    generateZKP,
    getAlerts, 
    resolvePatientAddressFromId,
    getPatientHistory,
    grantConsentGasless,
    claimWellnessRewards
} from "../controllers/patientController.js";
import { 
    resolvePatientId, 
    resolvePatientAddress as resolveById,
    getPatientByIdentifier 
} from "../services/patientResolver.js";
import { cacheMiddleware } from "../services/cache.js";
import { 
    validateBody, 
    validateParams, 
    PatientVitalsSchema, 
    PatientAlertSchema, 
    PatientIdParamSchema,
    PaginationSchema,
    validateQuery,
    ZKPGenerateSchema
} from "../middleware/validation.js";
import { writeLimiter, blockchainLimiter } from "../middleware/security.js";

const router = express.Router();

const patientCache = cacheMiddleware(60, (req) => `patient:${req.params.id || req.params.identifier}`);

/**
 * @swagger
 * /patient/vitals:
 *   post:
 *     summary: Sync patient vitals
 *     tags: [Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *             properties:
 *               patientId:
 *                 type: string
 *               systolicBP:
 *                 type: integer
 *               diastolicBP:
 *                 type: integer
 *               heartRate:
 *                 type: integer
 *               temperature:
 *                 type: number
 *               weight:
 *                 type: number
 *               height:
 *                 type: number
 *               oxygenSat:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Vitals synced successfully
 *       400:
 *         description: Invalid request body
 */
router.post("/vitals", writeLimiter, validateBody(PatientVitalsSchema), syncVitals);

/**
 * @swagger
 * /patient/alerts:
 *   post:
 *     summary: Sync patient alert
 *     tags: [Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               alertType:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert synced
 */
router.post("/alerts", writeLimiter, validateBody(PatientAlertSchema), syncAlert);

/**
 * @swagger
 * /patient/zkp/generate:
 *   post:
 *     summary: Generate zero-knowledge proof for patient data
 *     tags: [Patient]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               dataType:
 *                 type: string
 *     responses:
 *       200:
 *         description: ZKP generated
 */
router.post("/zkp/generate", blockchainLimiter, validateBody(ZKPGenerateSchema), generateZKP);

/**
 * @swagger
 * /patient/alerts/{address}:
 *   get:
 *     summary: Get patient alerts
 *     tags: [Patient]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of alerts
 */
router.get("/alerts/:address", validateParams(PatientIdParamSchema), patientCache, getAlerts);
router.get("/resolve/:id", validateParams(PatientIdParamSchema), patientCache, resolvePatientAddressFromId);
router.get("/history/:id", validateParams(PatientIdParamSchema), patientCache, getPatientHistory);
router.get("/resolve-id/:identifier", validateParams(PatientIdParamSchema), patientCache, async (req, res) => {
    try {
        const { identifier } = req.params;
        const patientId = await resolvePatientId(identifier);
        if (!patientId) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json({ patientId: patientId.toString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /patient/resolve-address/{identifier}:
 *   get:
 *     summary: Resolve patient address by identifier
 *     tags: [Patient]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient address
 *       404:
 *         description: Patient not found
 */
router.get("/resolve-address/:identifier", validateParams(PatientIdParamSchema), async (req, res) => {
    try {
        const { identifier } = req.params;
        const address = await resolveById(identifier);
        if (!address) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json({ address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /patient/lookup/{identifier}:
 *   get:
 *     summary: Lookup patient by identifier
 *     tags: [Patient]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient data
 *       404:
 *         description: Patient not found
 */
router.get("/lookup/:identifier", validateParams(PatientIdParamSchema), async (req, res) => {
    try {
        const { identifier } = req.params;
        const patient = await getPatientByIdentifier(identifier);
        if (!patient) {
            return res.status(404).json({ error: "Patient not found" });
        }
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New production-hardened routes
router.post("/consent/gasless", blockchainLimiter, grantConsentGasless);
router.post("/wellness/claim", blockchainLimiter, claimWellnessRewards);

export default router;
