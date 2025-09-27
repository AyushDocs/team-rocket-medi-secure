import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { PORT } from "./config.js";
import ipfsRoutes from "./routes/ipfs.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/ipfs", ipfsRoutes);

app.get("/", (req, res) => res.send("MedSecure Backend Running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
