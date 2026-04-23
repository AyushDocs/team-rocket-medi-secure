import express from "express";
import { initiateHandoff, finalizeHandoff, getPatientHandoffs } from "../controllers/handoffController.js";

const router = express.Router();

router.post("/init", initiateHandoff);
router.post("/finalize", finalizeHandoff);
router.get("/history/:address", getPatientHandoffs);

export default router;
