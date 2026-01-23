import express from "express";
import jwt from "jsonwebtoken";
import { getEmergencyData, triggerAccess } from "../controllers/emergencyController.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "emergency_magic_secret_123";

const verifyEmergencyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== "emergency_access") {
      throw new Error("Invalid token type");
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

router.post("/access", triggerAccess);
router.get("/data", verifyEmergencyToken, getEmergencyData);

export default router;
