import express from "express";
import { submitAutoClaim, getMyClaims, listPolicies } from "../controllers/insuranceController.js";

const router = express.Router();

router.post("/claim", submitAutoClaim);
router.get("/claims/:address", getMyClaims);
router.get("/policies", listPolicies);

export default router;
