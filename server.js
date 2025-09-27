import express from "express"
import bodyParser from "body-parser"
import cors from "cors";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("MedSecure Backend Running"));

app.listen(4000, () => console.log(`Server running on port 4000`));
