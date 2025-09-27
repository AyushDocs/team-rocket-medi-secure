const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { PORT } = require("./config");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);

app.get("/", (req, res) => res.send("MedSecure Backend Running"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
