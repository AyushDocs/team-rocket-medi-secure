import jwt from "jsonwebtoken";
import { patientContract, patientDetailsContract } from "../config/contracts.js";
import web3 from "../config/web3.js";

const JWT_SECRET = process.env.JWT_SECRET || "emergency_magic_secret_123";

export const triggerAccess = async (req, res) => {
  try {
    const { patientId, secret } = req.body;

    if (!patientId || !secret) {
      return res.status(400).json({ error: "Patient ID and secret are required" });
    }

    // Hash the secret to check against the contract
    const hashedSecret = web3.utils.keccak256(secret);

    console.log("--- DEBUG EMERGENCY ACCESS ---");
    console.log(`Original Secret: ${secret}`);
    console.log(`Hashed Secret (keccak256): ${hashedSecret}`);
    console.log(`Patient ID: ${patientId}`);
    console.log(`Contract Address: ${patientContract.options.address}`);

    // Call contract to verify
    let isValid = false;
    try {
      isValid = await patientContract.methods.verifyEmergencyHash(patientId, hashedSecret).call();
      console.log(`Verification result from contract: ${isValid}`);
      
      // Proactive check: what is stored in the contract?
      const storedHash = await patientContract.methods.emergencyAccessHashes(patientId).call();
      console.log(`Stored Hash in contract for Patient ${patientId}: ${storedHash}`);
    } catch (contractErr) {
      console.error("Smart Contract Call Failed during verification:");
      console.error(contractErr);
      return res.status(500).json({ 
        error: "Contract execution failed", 
        details: contractErr.message,
        contractAddress: patientContract.options.address
      });
    }

    if (!isValid) {
      const storedHash = await patientContract.methods.emergencyAccessHashes(patientId).call();
      console.log(`[EMERGENCY] Verification Failed for Patient ${patientId}`);
      console.log(`[EMERGENCY] Provided Secret: ${secret}`);
      console.log(`[EMERGENCY] Computed Hash: ${hashedSecret}`);
      console.log(`[EMERGENCY] Stored Hash: ${storedHash}`);
      return res.status(401).json({ 
        error: "Invalid emergency secret",
        debug: {
            providedHash: hashedSecret,
            storedHash: storedHash
        }
      });
    }

    // Generate a short-lived token (1 hour)
    const token = jwt.sign(
      { patientId, type: "emergency_access" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Access granted for 1 hour",
      token,
      expiresAt: new Date(Date.now() + 3600000)
    });
  } catch (error) {
    console.error("Error triggering emergency access:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEmergencyData = async (req, res) => {
  try {
    const { patientId } = req.user;

    // 1. Fetch patient details (contains wallet address)
    const patientDetails = await patientContract.methods.getPatientDetails(patientId).call();
    
    // 2. Fetch nominees (emergency contacts)
    const nominees = await patientContract.methods.getNominees(patientId).call();

    // 3. Fetch Medical Records (the "appropriate documents")
    // Note: OpenZeppelin ERC721URIStorage results in an array of records if we use our custom getMedicalRecords
    const records = await patientContract.methods.getMedicalRecords(patientId).call();

    // 4. Fetch Vitals from PatientDetails contract
    let vitals = null;
    try {
      console.log(`[EMERGENCY] Vitals Contract Address: ${patientDetailsContract.options.address}`);
      console.log(`[EMERGENCY] Fetching vitals for wallet: ${patientDetails.walletAddress}`);
      vitals = await patientDetailsContract.methods.getVitals(patientDetails.walletAddress).call();
      console.log(`[EMERGENCY] Vitals fetched successfully`);
    } catch (vitalsErr) {
      console.warn(`[EMERGENCY] Could not fetch vitals for patient ${patientId} (${patientDetails.walletAddress}):`, vitalsErr.message);
      // Optional: don't fail the whole request just because vitals are missing/failed
    }

    // Clean up the response and handle BigInt serialization
    // Some versions of Web3 return structs as objects, some as arrays, some as both
    const pName = patientDetails.name || patientDetails[2];
    const pWallet = patientDetails.walletAddress || patientDetails[3];
    const pAge = patientDetails.age || patientDetails[5];
    const pBlood = patientDetails.bloodGroup || patientDetails[6];
    const pEmail = patientDetails.email || patientDetails[4];

    const response = {
      name: pName,
      walletAddress: pWallet,
      age: Number(pAge),
      bloodGroup: pBlood,
      email: pEmail,
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
    console.error("Error fetching emergency data:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};
