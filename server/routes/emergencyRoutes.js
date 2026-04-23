import express from "express";
import jwt from "jsonwebtoken";
import { getEmergencyData, triggerAccess } from "../controllers/emergencyController.js";

import { CONFIG } from "../config/constants.js";

const router = express.Router();

const verifyEmergencyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET);
    if (decoded.type !== "emergency_access") {
      throw new Error("Invalid token type");
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * @swagger
 * /emergency/access:
 *   post:
 *     summary: Trigger emergency access to patient records
 *     tags: [Emergency]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientAddress
 *               - hospitalAddress
 *             properties:
 *               patientAddress:
 *                 type: string
 *                 description: Patient wallet address
 *               hospitalAddress:
 *                 type: string
 *                 description: Hospital wallet address
 *               reason:
 *                 type: string
 *                 description: Emergency reason
 *     responses:
 *       200:
 *         description: Emergency access granted
 *       400:
 *         description: Invalid request
 */
router.post("/access", triggerAccess);

/**
 * @swagger
 * /emergency/data:
 *   get:
 *     summary: Get emergency patient data (requires emergency token)
 *     tags: [Emergency]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency patient data
 *       401:
 *         description: Unauthorized
 */
router.get("/data", verifyEmergencyToken, getEmergencyData);

export default router;
