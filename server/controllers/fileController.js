import { CONFIG } from "../config/constants.js";
import { doctorContract } from "../config/contracts.js";
import web3 from "../config/web3.js";
import { getFileStream, uploadToIPFS } from "../services/ipfsService.js";

export const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: CONFIG.MESSAGES.FILE_NOT_FOUND });
        
        const { userAddress } = req.body;
        if (!userAddress) {
            return res.status(400).json({ error: "User address is required" });
        }

        const ipfsHash = await uploadToIPFS(req.file.buffer, req.file.originalname, userAddress);
        res.json({ ipfsHash });

    } catch (error) {
        console.error("Upload Error:", error.message);
        res.status(500).json({ error: error.message || "Failed to upload file" });
    }
};

export const getFile = async (req, res) => {
    try {
        const { hash } = req.params;
        const { userAddress, signature, patientAddress } = req.query;
        const authHeader = req.headers.authorization;

        let hasAccess = false;

        // 1. Check for Emergency Token (JWT)
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const token = authHeader.split(" ")[1];
            try {
                const JWT_SECRET = process.env.JWT_SECRET || "emergency_magic_secret_123";
                const decoded = (await import("jsonwebtoken")).default.verify(token, JWT_SECRET);
                
                if (decoded.type === "emergency_access") {
                    // Logic: Emergency access grants access to ALL records of that patient
                    // We should verify if this hash belongs to the patient.
                    // For now, if they have a valid emergency token, we allow it.
                    hasAccess = true;
                }
            } catch (jwtErr) {
                console.warn("Invalid JWT provided to getFile");
            }
        }

        // 2. Fallback to Signature + Contract Check if not already granted
        if (!hasAccess) {
            if (!userAddress) return res.status(400).json({ error: "User address is required" });
            if (!signature) return res.status(400).json({ error: "Signature or valid Emergency Token is required" });
            
            // Verify Signature
            try {
                const recoveredAddress = web3.eth.accounts.recover(hash, signature);
                if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) 
                    return res.status(401).json({ error: "Invalid signature" });
            } catch (err) {
                return res.status(401).json({ error: "Signature verification failed" });
            }

            if (userAddress.toLowerCase() === patientAddress?.toLowerCase()) {
                hasAccess = true;
            } else if (patientAddress) {
                hasAccess = await doctorContract.methods
                    .hasAccessToDocument(patientAddress, hash)
                    .call({ from: userAddress });
            }
        }

        if (!hasAccess) return res.status(403).json({ error: CONFIG.MESSAGES.ACCESS_DENIED });

        const response = await getFileStream(hash);
        res.setHeader("Content-Type", response.headers["content-type"]);
        response.data.pipe(res);

    } catch (error) {
        console.error("Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch file" });
    }
};
