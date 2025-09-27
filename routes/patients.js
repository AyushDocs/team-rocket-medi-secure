const express = require("express");
const router = express.Router();
const { addPatient, getPatient, updatePatient } = require("../services/patientService");
const { getAuditLogs } = require("../services/auditService");
const { verifyToken } = require("../utils/jwt");

// Middleware for auth
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) return res.status(401).json({ error: "Unauthorized" });
  req.providerId = decoded.id;
  next();
}

router.use(authMiddleware);

// Add patient
router.post("/", (req, res) => {
  const patient = req.body;
  const result = addPatient(patient, req.providerId);
  res.status(201).json(result);
});

// Get patient
router.get("/:id", (req, res) => {
  const data = getPatient(req.params.id, req.providerId);
  if (!data) return res.status(403).json({ error: "Access denied" });
  res.json(data);
});

// Update patient
router.put("/:id", (req, res) => {
  const data = updatePatient(req.params.id, req.providerId, req.body);
  if (!data) return res.status(403).json({ error: "Access denied" });
  res.json(data);
});

// Get audit logs
router.get("/:id/audit", (req, res) => {
  const logs = getAuditLogs(req.params.id);
  res.json(logs);
});

module.exports = router;
