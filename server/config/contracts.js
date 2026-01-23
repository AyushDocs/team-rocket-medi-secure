import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import web3 from "./web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadContract = (contractName, customPath = null) => {
  try {
    const artifactPath = customPath || path.resolve(__dirname, `../../contracts/build/contracts/${contractName}.json`);
    if (!fs.existsSync(artifactPath)) {
      console.warn(`Artifact not found at ${artifactPath}, trying frontend path...`);
      const frontendPath = path.resolve(__dirname, `../../frontend/contracts/${contractName}.json`);
      if (!fs.existsSync(frontendPath)) throw new Error(`Artifact ${contractName} not found`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Attempt to find any network ID that has an address
    let address;
    const networks = artifact.networks || {};
    // Priority: 1337, then 5777, then anything else
    const preferredNetworkIds = ["1337", "5777", ...Object.keys(networks)];
    for (const id of preferredNetworkIds) {
      if (networks[id]) {
        address = networks[id].address;
        break;
      }
    }

    if (!address) throw new Error(`${contractName} not deployed to any known network`);
    console.log(`Loaded ${contractName} at ${address}`);
    return new web3.eth.Contract(artifact.abi, address);
  } catch (error) {
    console.error(`Failed to load ${contractName} contract:`, error.message);
    return null;
  }
};

export const doctorContract = loadContract("Doctor");
export const marketplaceContract = loadContract("Marketplace");
export const patientContract = loadContract("Patient");
export const patientDetailsContract = loadContract("PatientDetails", path.resolve(__dirname, "../../frontend/contracts/PatientDetailsProxy.json"));
