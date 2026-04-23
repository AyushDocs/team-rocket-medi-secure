import express from "express";
import { createWalletForUser, signMessage, signTypedData, getBalance, sendTransaction, seedWallet } from "../services/custodianWalletService.js";
import Web3 from "web3";
import { logError } from "../services/logger.js";

const router = express.Router();
const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");

router.post("/create-wallet", async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    const wallet = createWalletForUser(userId);
    
    // Seed wallet in background if in dev mode
    seedWallet(wallet.address).catch(err => {
        logError(err, { context: "background_seed", userId });
    });
    
    res.json({
      success: true,
      wallet: {
        address: wallet.address,
        publicKey: wallet.publicKey
      }
    });
  } catch (error) {
    logError(error, { requestId: req.id, userId: req.body.userId });
    next(error);
  }
});

router.post("/sign-message", async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ error: "userId and message are required" });
    }
    
    const wallet = createWalletForUser(userId);
    const signature = signMessage(wallet.privateKey, message);
    
    res.json({
      success: true,
      signature,
      address: wallet.address
    });
  } catch (error) {
    logError(error, { requestId: req.id, userId: req.body.userId });
    next(error);
  }
});

router.post("/sign-typed-data", async (req, res, next) => {
  try {
    const { userId, domain, types, value } = req.body;
    
    if (!userId || !domain || !types || !value) {
      return res.status(400).json({ error: "userId, domain, types, and value are required" });
    }
    
    const wallet = createWalletForUser(userId);
    const signature = signTypedData(wallet.privateKey, domain, types, value);
    
    res.json({
      success: true,
      signature,
      address: wallet.address
    });
  } catch (error) {
    logError(error, { requestId: req.id, userId: req.body.userId });
    next(error);
  }
});

router.post("/send-transaction", async (req, res, next) => {
  try {
    const { userId, txData } = req.body;
    
    if (!userId || !txData) {
      return res.status(400).json({ error: "userId and txData are required" });
    }
    
    const wallet = createWalletForUser(userId);
    const result = await sendTransaction(wallet.privateKey, txData);
    
    res.json({
      success: true,
      transactionHash: result.transactionHash,
      receipt: result
    });
  } catch (error) {
    logError(error, { requestId: req.id, userId: req.body.userId });
    next(error);
  }
});

router.get("/balance/:address", async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !web3.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }
    
    const balance = await getBalance(address);
    
    res.json({
      success: true,
      balance: balance.toString(),
      balanceInEth: web3.utils.fromWei(balance, "ether")
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ error: "Failed to get balance" });
  }
});

router.post("/faucet", async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !web3.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }
    
    await seedWallet(address);
    res.json({ success: true, message: `Seeded ${address} with 1 ETH` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/link-wallet", (req, res) => {

  try {
    const { userId, externalAddress } = req.body;
    
    if (!userId || !externalAddress) {
      return res.status(400).json({ error: "userId and externalAddress are required" });
    }
    
    if (!web3.utils.isAddress(externalAddress)) {
      return res.status(400).json({ error: "Invalid Ethereum address" });
    }
    
    res.json({
      success: true,
      message: "Wallet linked successfully"
    });
  } catch (error) {
    console.error("Error linking wallet:", error);
    res.status(500).json({ error: "Failed to link wallet" });
  }
});

export default router;