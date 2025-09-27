import { ethers } from "ethers";
import { addOrUpdateUser, getUser } from "./ipfsHelpers.js";
import MedSecureABI from "./MedSecureABI.js";
import { setCid, getCid } from "./cidRegistry.js";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();

const medSecureAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const medSecureContract = new ethers.Contract(medSecureAddress, MedSecureABI.abi, signer);

const ENCRYPTION_KEY = "6uRg6Asjb6CEOb6+m3A+tTkdYB/DcLZSdwx7YrFO3ZE=";

// Convert CID → bytes32 hash for on-chain storage
function cidToHash(cid) {
  return ethers.keccak256(ethers.toUtf8Bytes(cid));
}

// --- Create new patient
export async function createPatient(walletAddress, metadata) {
  const cid = await addOrUpdateUser(walletAddress, metadata, ENCRYPTION_KEY);
  const cidHash = cidToHash(cid);
  setCid(cidHash, cid);

  const tx = await medSecureContract.createPatient(cidHash);
  await tx.wait();

  console.log("Patient created:", { cid, cidHash, txHash: tx.hash });
  return cid;
}

// --- Update patient record
export async function updatePatientRecord(walletAddress, updatedFields) {
  const currentData = await getUser(getCid(cidToHash(walletAddress)), ENCRYPTION_KEY).catch(() => ({}));
  const newData = { ...currentData, ...updatedFields };

  const newCID = await addOrUpdateUser(walletAddress, newData, ENCRYPTION_KEY);
  const newHash = cidToHash(newCID);
  setCid(newHash, newCID);

  const tx = await medSecureContract.updateRecord(1, newHash); // demo patientId = 1
  await tx.wait();

  console.log("Record updated:", { cid: newCID, hash: newHash, txHash: tx.hash });
  return newCID;
}

// --- Read patient history
export async function readPatientHistory(walletAddress) {
  const recordHashes = await medSecureContract.getAllRecords(1); // demo patientId = 1
  const history = [];

  for (const hash of recordHashes) {
    const cid = getCid(hash);
    if (!cid) {
      console.warn("CID missing for hash:", hash);
      continue;
    }
    const data = await getUser(cid, ENCRYPTION_KEY);
    history.push({ cid, data });
  }

  console.log("Full patient history:", history);
  return history;
}

// --- Demo
async function main() {
  const walletAddress = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";

  // 1️⃣ Create patient
  await createPatient(walletAddress, {
    name: "Bob Johnson",
    img: "https://avatars.githubusercontent.com/u/4368928?s=48&v=4",
    blood: "B+",
    allergies: ["None"],
    records: []
  });

  // 2️⃣ Update records
  await updatePatientRecord(walletAddress, { records: [{ date: "2025-09-27", note: "Initial checkup" }] });
  await updatePatientRecord(walletAddress, { records: [{ date: "2025-09-28", note: "Lab results received" }] });

  // 3️⃣ Read full history
  await readPatientHistory(walletAddress);
}

// main().catch(console.error);
