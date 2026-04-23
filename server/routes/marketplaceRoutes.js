import express from "express";
import { sellDataGasless, getActiveOffers, getEarnings } from "../controllers/marketplaceController.js";
import { blockchainLimiter } from "../middleware/security.js";

const router = express.Router();

router.get("/offers", getActiveOffers);
router.get("/earnings/:address", getEarnings);
router.post("/sell/gasless", blockchainLimiter, sellDataGasless);

export default router;
