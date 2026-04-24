import jwt from "jsonwebtoken";
import { patientContract, patientDetailsContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

import { CONFIG } from "../config/constants.js";

export const triggerAccess = async (req, res) => {
  try {
    const { patientId, secret } = req.body;
    console.log(`[EMERGENCY-DEBUG] Incoming Access Request:`, { patientId, secretLength: secret?.length });

    if (!patientId || !secret) {
      return res.status(400).json({ error: "Patient ID and secret are required" });
    }

    // Ensure patientId is numeric (contract expects uint256 index)
    if (!/^\d+$/.test(patientId.toString())) {
        return res.status(400).json({ 
            error: "Invalid Patient ID format", 
            details: "Patient ID must be a numeric index (e.g., '1'). Received: " + patientId
        });
    }

    // Hash the secret to check against the contract
    // Note: web3.utils.keccak256(hexString) correctly hashes the data bytes if it starts with 0x
    const hashedSecret = web3.utils.keccak256(secret);
    console.log(`[EMERGENCY-DEBUG] Generated Hash:`, hashedSecret);

    // 1. Resolve Patient ID to Wallet Address
    let patientDetails;
    try {
        console.log(`[EMERGENCY-DEBUG] Looking up patient details for ID: ${patientId}`);
        patientDetails = await patientContract.methods.getPatientDetails(patientId).call();
        console.log(`[EMERGENCY-DEBUG] Blockchain response:`, patientDetails);
    } catch (e) {
        console.error(`[EMERGENCY-DEBUG] Blockchain Lookup Error:`, e.message);
        return res.status(502).json({ 
            error: "Blockchain communication failure",
            details: e.message 
        });
    }

    const walletAddress = patientDetails.walletAddress || patientDetails[3];

    if (!walletAddress || walletAddress === "0x0000000000000000000000000000000000000000") {
        return res.status(404).json({ error: `Patient ID ${patientId} not found in MediSecure registry` });
    }

    // 2. Fetch Stored Hash from Contract Mapping
    let storedHash;
    try {
        storedHash = await patientContract.methods.emergencyAccessHashes(walletAddress).call();
    } catch (e) {
        console.error(`[EMERGENCY-DEBUG] Registry Lookup Error:`, e.message);
        return res.status(502).json({ error: "Emergency registry lookup failed", details: e.message });
    }

    if (!storedHash || storedHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        return res.status(403).json({ error: "Emergency access not configured for this patient" });
    }

    const isValid = (hashedSecret === storedHash);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid emergency credentials" });
    }

    // Step 3: Server-side audit log
    console.log(`[HIPAA-AUDIT] Emergency Access GRANTED for patient ${patientId} / ${walletAddress} at ${new Date().toISOString()}`);

    // Generate token
    const token = jwt.sign(
      { patientId, type: "emergency_access" },
      CONFIG.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Break-Glass Access Authorized",
      token,
      expiresAt: new Date(Date.now() + 3600000)
    });
  } catch (error) {
    console.error("Critical Failure in Emergency Protocol:", error);
    res.status(500).json({ error: "Emergency services unavailable", details: error.message });
  }
};

export const getEmergencyData = async (req, res) => {
  try {
    const { patientId } = req.user;

    // 1. Fetch patient details (contains wallet address)
    const patientDetails = await patientContract.methods.getPatientDetails(patientId).call();
    const walletAddress = patientDetails.walletAddress || patientDetails[3];
    
    // 2. Fetch nominees (emergency contacts) - Wrap in try/catch as this function is often missing
    let nominees = [];
    try {
        nominees = await patientContract.methods.getNominees(patientId).call();
    } catch (e) {
        console.warn(`[EMERGENCY] getNominees call failed or function missing:`, e.message);
    }

    // 3. Fetch Medical Records
    let records = [];
    try {
        records = await patientContract.methods.getMedicalRecords(patientId).call();
    } catch (e) {
        console.warn(`[EMERGENCY] getMedicalRecords call failed:`, e.message);
    }

    // 4. Fetch Vitals from PatientDetails contract
    let vitals = null;
    try {
      vitals = await patientDetailsContract.methods.getVitals(walletAddress).call();
    } catch (vitalsErr) {
      console.warn(`[EMERGENCY] Vitals fetch skipped or contract unavailable:`, vitalsErr.message);
    }

    const response = {
      name: patientDetails.name || patientDetails[2],
      walletAddress: walletAddress,
      age: Number(patientDetails.age || patientDetails[5]),
      bloodGroup: patientDetails.bloodGroup || patientDetails[6],
      email: patientDetails.email || patientDetails[4],
      emergencyContacts: (nominees || []).map(n => ({
        name: n.name || n[0],
        relationship: n.relationship || n[2],
        contactNumber: n.contactNumber || n[3]
      })),
      medicalRecords: (records || [])
        .filter(r => r.isEmergencyViewable || r[5])
        .map(r => ({
          fileName: r.fileName || r[1],
          ipfsHash: r.ipfsHash || r[0],
          hospital: r.hospital || r[3],
          date: r.recordDate || r[2]
        })),
      vitals: vitals ? {
        bloodPressure: vitals.bloodPressure || vitals[0],
        heartRate: vitals.heartRate || vitals[3],
        temperature: vitals.temperature || vitals[4],
        weight: vitals.weight || vitals[1],
        height: vitals.height || vitals[2],
        lastUpdated: (vitals.lastUpdated || vitals[5])?.toString() || null
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error("Error retrieving emergency payload:", error);
    res.status(500).json({ error: "Data retrieval failed", details: error.message });
  }
};
