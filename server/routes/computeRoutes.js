import express from "express";
import { executeCompute } from "../controllers/computeController.js";

const router = express.Router();

router.post("/execute", executeCompute);

export default router;
