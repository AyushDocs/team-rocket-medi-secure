import { createWalletForUser } from "./services/custodianWalletService.js";
import Web3 from "web3";
import dotenv from "dotenv";

dotenv.config();

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");
const userId = "yjzn3Y9wRgMg299nx1IvBltJy1x2";

const wallet = createWalletForUser(userId);
console.log("UserID:", userId);
console.log("Wallet Address:", wallet.address);

const balance = await web3.eth.getBalance(wallet.address);
console.log("Balance:", web3.utils.fromWei(balance, "ether"), "ETH");

const accounts = await web3.eth.getAccounts();
console.log("Ganache Accounts[0]:", accounts[0]);
const faucetBalance = await web3.eth.getBalance(accounts[0]);
console.log("Faucet Balance:", web3.utils.fromWei(faucetBalance, "ether"), "ETH");
