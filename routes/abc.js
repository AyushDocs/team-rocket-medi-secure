import { ethers } from "ethers";
import MedSecureABI from "../ipfs/MedSecureABI.js"; // Your contract ABI

// Connect to a provider (e.g., Infura, Alchemy, local node)
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

const medSecureAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const medSecureContract = new ethers.Contract(medSecureAddress, MedSecureABI.abi, signer);
export default medSecureContract;