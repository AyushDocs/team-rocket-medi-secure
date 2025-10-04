import express from "express";
import multer from "multer";
import { create } from "ipfs-http-client";
import cors from "cors";

const app = express();
const port = 5000;

// Middleware
app.use(cors());
const upload = multer();

// Initialize IPFS client
const ipfs = create({
  host: "127.0.0.1",
  port: 5001,
  protocol: "http",
});

// Route to handle file uploads
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileBuffer = req.file.buffer;
    const added = await ipfs.add(fileBuffer);

    res.json({ ipfsHash: added.path });
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    res.status(500).json({ error: "Failed to upload file to IPFS" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`IPFS server running at http://localhost:${port}`);
});