import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./cidRegistry.json"); // store in project root
let registry = new Map();

// Load existing registry from file on startup
if (fs.existsSync(FILE_PATH)) {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8");
    const obj = JSON.parse(raw);
    registry = new Map(Object.entries(obj));
    console.log(`Loaded ${registry.size} CID entries from ${FILE_PATH}`);
  } catch (err) {
    console.error("Failed to read cidRegistry.json:", err);
  }
}

// Save registry to JSON file
function persist() {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(Object.fromEntries(registry), null, 2));
  } catch (err) {
    console.error("Failed to persist cidRegistry:", err);
  }
}

// Set a new mapping
export function setCid(hash, cid) {
  registry.set(hash, cid);
  persist();
}

// Get CID by hash
export function getCid(hash) {
  return registry.get(hash);
}

// Optionally: get all entries
export function getAllCids() {
  return Array.from(registry.entries());
}
