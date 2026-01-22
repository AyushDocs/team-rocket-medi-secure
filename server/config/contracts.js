import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import web3 from "./web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadContract = (contractName) => {
  try {
    const artifactPath = path.resolve(__dirname, `../../contracts/build/contracts/${contractName}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const networkId = Object.keys(artifact.networks)[0];
    if (!networkId) throw new Error(`${contractName} not deployed to any network`);
    
    const address = artifact.networks[networkId].address;
    return new web3.eth.Contract(artifact.abi, address);
  } catch (error) {
    console.error(`Failed to load ${contractName} contract:`, error.message);
    return null;
  }
};

export const doctorContract = loadContract("Doctor");
export const marketplaceContract = loadContract("Marketplace");
