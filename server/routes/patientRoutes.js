import express from "express";
import { 
    syncVitals, 
    syncAlert, 
    generateZKP, 
    getAlerts, 
    resolvePatientAddress,
    getPatientHistory 
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/vitals", syncVitals);
router.post("/alerts", syncAlert);
router.post("/zkp/generate", generateZKP);
router.get("/alerts/:address", getAlerts);
router.get("/resolve/:id", resolvePatientAddress);
router.get("/history/:id", getPatientHistory);

export default router;
