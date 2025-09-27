const { login } = require("../services/authService");
const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });
  const result = login(email, password);
  if (!result) return res.status(401).json({ error: "Invalid credentials" });
  res.json(result);
});

module.exports = router;
