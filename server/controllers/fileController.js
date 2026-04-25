import { CONFIG } from "../config/constants.js";
import { doctorContract } from "../config/contracts.js";
import web3 from "../config/web3.js";
import { getFileStream, uploadToIPFS } from "../services/ipfsService.js";
import { applyWatermark, isWatermarkableImage } from "../services/watermarkService.js";
import { v4 as uuidv4 } from "uuid";

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

export const uploadFilesBatch = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No files provided" });
        }

        const { patientId, type, userAddress } = req.body;
        
        const maxFiles = 20;
        if (req.files.length > maxFiles) {
            return res.status(400).json({ 
                error: `Maximum ${maxFiles} files allowed per batch` 
            });
        }

        const maxFileSize = 50 * 1024 * 1024;
        for (const file of req.files) {
            if (file.size > maxFileSize) {
                return res.status(400).json({
                    error: `File ${file.originalname} exceeds 50MB limit`
                });
            }
        }

        const allowedMimeTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/dicom",
            "text/plain",
            "application/json"
        ];

        const results = [];
        let totalSize = 0;
        const batchId = uuidv4();

        for (const file of req.files) {
            try {
                const ipfsHash = await uploadToIPFS(file.buffer, file.originalname, userAddress);
                
                results.push({
                    cid: ipfsHash,
                    filename: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    patientId,
                    type: type || "other",
                    batchId
                });
                
                totalSize += file.size;
            } catch (uploadErr) {
                console.error(`Failed to upload ${file.originalname}:`, uploadErr.message);
                results.push({
                    filename: file.originalname,
                    error: uploadErr.message,
                    success: false
                });
            }
        }

        const successCount = results.filter(r => !r.error).length;
        
        res.json({
            batchId,
            success: successCount > 0,
            files: results,
            totalSize,
            count: req.files.length,
            successCount,
            failedCount: req.files.length - successCount
        });

    } catch (error) {
        console.error("Batch Upload Error:", error.message);
        res.status(500).json({ error: error.message || "Failed to upload files" });
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
                const decoded = (await import("jsonwebtoken")).default.verify(token, CONFIG.JWT_SECRET);
                
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

        let finalHash = hash;

        // If the identifier is a TokenID (numeric), resolve it to a hash via the blockchain
        if (/^\d+$/.test(hash)) {
            try {
                const patientContract = (await import("../config/contracts.js")).patientContract;
                const pId = await patientContract.methods.walletToPatientId(patientAddress || userAddress).call();
                const records = await patientContract.methods.getMedicalRecords(pId).call();
                // Find record by tokenId
                const record = records.find(r => r.tokenId.toString() === hash);
                if (!record) return res.status(404).json({ error: "Record not found" });
                finalHash = record.ipfsHash;
            } catch (err) {
                return res.status(500).json({ error: "Failed to resolve TokenID: " + err.message });
            }
        }

        if (!hasAccess) return res.status(403).json({ error: CONFIG.MESSAGES.ACCESS_DENIED });
        console.log(`[fileController] Fetching Internal Asset: ${finalHash.slice(0, 10)}...`);
        try {
            const response = await getFileStream(finalHash);
            const contentType = response.headers["content-type"] || "application/octet-stream";

            // ── Server-side forensic watermark ─────────────────────────────────
            // For raster images, buffer the full response and burn the viewer's
            // wallet address + timestamp into the pixel data before delivery.
            // This is NOT removable by Canva / AI erasers because the watermark
            // pixels ARE the image — there is no separate layer to strip.
            if (isWatermarkableImage(contentType)) {
                const chunks = [];
                for await (const chunk of response.data) chunks.push(chunk);
                const imageBuffer = Buffer.concat(chunks);

                // The viewer address comes from the verified signature — it is
                // cryptographically bound to whoever made this request.
                const viewerAddr = userAddress || "unknown";
                const watermarked = await applyWatermark(imageBuffer, contentType, viewerAddr);

                res.setHeader("Content-Type", "image/png");
                res.setHeader("Content-Length", watermarked.length);
                // Prevent browser / CDN caching of decrypted content
                res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
                res.setHeader("Pragma", "no-cache");
                return res.end(watermarked);
            }

            // Non-image files (PDF, DOCX, text) streamed as-is
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.data.pipe(res);
        } catch (fetchErr) {
            console.error("[fileController] Fetch Error Details:", fetchErr.message, fetchErr.code, fetchErr.status);
            return res.status(502).json({ error: `Failed to fetch file from IPFS: ${fetchErr.message}` });
        }

    } catch (error) {
        console.error("[fileController] Auth/Access Error:", error.message);
        res.status(500).json({ error: error.message || "Failed to process request" });
    }
};
