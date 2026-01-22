import Web3 from "web3";
import { CONFIG } from "./constants.js";

const web3 = new Web3(CONFIG.RPC_URL);

export default web3;
