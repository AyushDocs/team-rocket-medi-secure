import express from "express";
import multer from "multer";
import { getFile, uploadFile } from "../controllers/fileController.js";
import { uploadFilesBatch } from "../controllers/fileController.js";
import { ipfsLimiter, writeLimiter } from "../middleware/security.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
  }
});

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload single file to IPFS
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUpload'
 */
router.post("/", ipfsLimiter, upload.single("file"), uploadFile);

/**
 * @swagger
 * /files/batch:
 *   post:
 *     summary: Upload multiple files to IPFS in a single transaction
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               patientId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [medical_record, prescription, lab_result, imaging, other]
 *     responses:
 *       200:
 *         description: All files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cid:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       size:
 *                         type: integer
 *                 totalSize:
 *                   type: integer
 *                 count:
 *                   type: integer
 */
router.post("/batch", ipfsLimiter, upload.array("files", 20), uploadFilesBatch);

/**
 * @swagger
 * /files/batch-status/{batchId}:
 *   get:
 *     summary: Get batch upload status
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Batch status
 */
router.get("/batch-status/:batchId", async (req, res) => {
    const { batchId } = req.params;
    res.json({ batchId, status: "completed" });
});

/**
 * @swagger
 * /files/{hash}:
 *   get:
 *     summary: Get file from IPFS
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: hash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File content
 */
router.get("/:hash", getFile);

export default router;