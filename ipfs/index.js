import { ethers } from "ethers";
import { addOrUpdateUser, getUser } from "./ipfsHelpers.js";
import MedSecureABI from "./MedSecureABI.json";

const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = provider.getSigner();
const medSecureAddress = "0xYourMedSecureContractAddress";
const medSecureContract = new ethers.Contract(medSecureAddress, MedSecureABI, signer);

const ENCRYPTION_KEY = "supersecretkey";

// --- Map to track patient wallet → latest CID ---
const walletToCID = new Map();

/**
 * Create a new patient with initial metadata
 */
export async function createPatient(walletAddress, metadata) {
  const cid = await addOrUpdateUser(walletAddress, metadata, ENCRYPTION_KEY);
  walletToCID.set(walletAddress, cid);

  const bytes32Hash = ethers.utils.formatBytes32String(cid.substring(0, 32));
  const tx = await medSecureContract.createPatient(bytes32Hash);
  await tx.wait();

  console.log("Patient created. CID:", cid, "TX:", tx.hash);
  return cid;
}

/**
 * Update patient record with versioning
 */
export async function updatePatientRecord(walletAddress, updatedFields) {
  const currentData = await getUser(walletAddress, ENCRYPTION_KEY);
  const newData = { ...currentData, ...updatedFields };

  const newCID = await addOrUpdateUser(walletAddress, newData, ENCRYPTION_KEY);
  walletToCID.set(walletAddress, newCID);

  const bytes32Hash = ethers.utils.formatBytes32String(newCID.substring(0, 32));
  const tx = await medSecureContract.updateRecord(1, bytes32Hash); // Use patientId = 1 for demo
  await tx.wait();

  console.log("Record updated. New CID:", newCID, "TX:", tx.hash);
  return newCID;
}

/**
 * Read full patient history
 */
export async function readPatientHistory(walletAddress) {
  const recordHashes = await medSecureContract.getAllRecords(1); // patientId = 1
  const history = [];

  for (const hashBytes of recordHashes) {
    const cid = ethers.utils.parseBytes32String(hashBytes);
    const data = await getUser(walletAddress, ENCRYPTION_KEY);
    history.push({ cid, data });
  }

  console.log("Full patient history:", history);
  return history;
}

/**
 * Demo workflow
 */
async function main() {
  const walletAddress = "0xPatientWalletAddress";

  // 1. Create patient
  await createPatient(walletAddress, {
    name: "Bob Johnson",
    img: "https://example.com/bob.png",
    blood: "B+",
    allergies: ["None"],
    records: []
  });

  // 2. Update records (multiple updates)
  await updatePatientRecord(walletAddress, { records: [{ date: "2025-09-27", note: "Initial checkup" }] });
  await updatePatientRecord(walletAddress, { records: [{ date: "2025-09-28", note: "Lab results received" }] });

  // 3. Read full history
  await readPatientHistory(walletAddress);
}

main().catch(console.error);
