import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { CONFIG } from "./config/constants.js";
import computeRoutes from "./routes/computeRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import { initializeSocket } from "./services/socketService.js";

// Global BigInt serialization fix
BigInt.prototype.toJSON = function() { return this.toString() }

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
initializeSocket(io);
app.use("/files", fileRoutes);
app.use("/compute", computeRoutes);
app.use("/emergency", emergencyRoutes);
app.get("/", (req, res) =>res.json({ message: "MediSecure API is running" }));

if (process.env.NODE_ENV !== 'test') 
  httpServer.listen(CONFIG.PORT, () => console.log(`Server running on port ${CONFIG.PORT}`));

export default app;