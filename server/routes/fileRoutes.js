import express from "express";
import multer from "multer";
import { getFile, uploadFile } from "../controllers/fileController.js";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), uploadFile);
router.get("/:hash", getFile);

export default router;
