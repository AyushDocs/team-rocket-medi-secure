import pinataSDK from "@pinata/sdk";
import axios from "axios";
import cors from "cors";
import "dotenv/config";
import express from "express";
import FormData from "form-data"; // Import form-data package explicitly here
import fs from "fs";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import { Server } from "socket.io";
import { Readable } from "stream";
import { fileURLToPath } from "url";
import Web3 from "web3";

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"],
  },
});

const chatHistory = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    
    // Load history
    if (chatHistory[room]) {
        socket.emit("load_history", chatHistory[room]);
    }
  });

  socket.on("send_message", (data) => {
    if (!chatHistory[data.room]) chatHistory[data.room] = [];
    chatHistory[data.room].push(data);
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json()); // Ensure JSON body parsing
const upload = multer();

// Initialize Pinata client
const pinata = new pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_SECRET_API_KEY
);

// Verify Pinata Connection
pinata.testAuthentication().then((result) => {
    console.log("Pinata Connected:", result);
}).catch((err) => {
    console.error("Pinata Connection Failed:", err);
});

const web3 = new Web3(process.env.RPC_URL);

const loadContract = () => {
  try {
    const artifactPath = path.join(__dirname, "../contracts/build/contracts/Doctor.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const networkId = Object.keys(artifact.networks)[0]; // Get the first available network
    if (!networkId) throw new Error("Contract not deployed to any network");
    
    const address = artifact.networks[networkId].address;
    return new web3.eth.Contract(artifact.abi, address);
  } catch (error) {
    console.error("Failed to load contract:", error.message);
    return null;
  }
};

const doctorContract = loadContract();
// if(!doctorContract) throw new Error("Failed to load contract"); // Soft fail for now to allow server start

app.post("/files", upload.single("file"), async (req, res) => {
  try {
    console.log("----- Upload Request Received -----");
    console.log("Files:", req.file ? "Present" : "Missing");
    console.log("Body:", req.body);

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const { userAddress } = req.body;
    if (!userAddress) {
        console.error("Missing userAddress in body");
        return res.status(400).json({ error: "User address is required" });
    }

    // Ensure metadata is clean
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    console.log("Sanitized Filename:", safeName);

    // Construct Metadata
    const metadata = JSON.stringify({
        name: safeName,
        keyvalues: {
            owner: userAddress
        }
    });
    console.log("Pinata Metadata:", metadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0
    });

    // Construct FormData manually for stability
    const formData = new FormData();
    
    // Use Stream with known length to prevent ECONNRESET
    const stream = Readable.from(req.file.buffer);
    formData.append('file', stream, {
        filename: safeName,
        knownLength: req.file.size // CRITICAL: Helps Axios/FormData set Content-Length header
    });
    
    formData.append('pinataMetadata', metadata);
    formData.append('pinataOptions', pinataOptions);
    
    console.log("Stream prepared. Size:", req.file.size);
    console.log("Sending to Pinata...");

    // Direct Axios call to avoid SDK stream issues
    const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
            maxBodyLength: Infinity,
            timeout: 300000, // 5 minute timeout
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
            }
        }
    );

    console.log("Pinata Success:", response.data);
    res.json({ ipfsHash: response.data.IpfsHash });

  } catch (error) {
    console.error("Pinata Upload Error Details:", error?.response?.data || error.message);
    const errorDetails = error?.response?.data;
    
    // Check for specific Pinata errors
    if (errorDetails && errorDetails.error) {
        console.error("Pinata Specific Message:", errorDetails.error);
    }
    
    const errorMsg = errorDetails?.error || error.message || "Failed to upload file to Pinata";
    res.status(500).json({ error: errorMsg, details: errorDetails });
  }
});

app.get("/files/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    const {userAddress,signature,patientAddress} = req.query;

    if (!userAddress) return res.status(400).json({ error: "User address is required" });
    if (!signature) return res.status(400).json({ error: "Signature is required for verification" });
    
    try {
        const recoveredAddress = web3.eth.accounts.recover(hash, signature);
        if (recoveredAddress.toLowerCase() !== userAddress.toLowerCase()) 
            return res.status(401).json({ error: "Invalid signature: Address mismatch" });
    } catch (err) {
        return res.status(401).json({ error: "Signature verification failed" });
    }

    let hasAccess = false;

    if (userAddress.toLowerCase() === patientAddress.toLowerCase()) {
        hasAccess = true;
    } 
    else if (patientAddress) {
        try {
            hasAccess = await doctorContract.methods
                .hasAccessToDocument(patientAddress, hash)
                .call({ from: userAddress });
        } catch (chainError) {
            console.error("Blockchain verification failed:", chainError);
            hasAccess = false;
        }
    } else {
        return res.status(400).json({ error: "Patient address required for verification" });
    }

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    // Stream file from Pinata Gateway
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
    const response = await axios.get(gatewayUrl, { responseType: 'stream' });

    res.setHeader("Content-Type", response.headers["content-type"]);
    response.data.pipe(res);

  } catch (error) {
    console.error("Error fetching files from Pinata:", error);
    res.status(500).json({ error: "Failed to fetch files from Pinata" });
  }
});
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;