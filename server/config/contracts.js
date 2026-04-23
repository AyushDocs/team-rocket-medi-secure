import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import web3 from "./web3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_BUILD_DIR = path.resolve(__dirname, "../../contracts/build/contracts");
const FRONTEND_CONTRACTS_DIR = path.resolve(__dirname, "../../frontend/contracts");

const REQUIRED_CONTRACTS = [
    'Patient',
    'Doctor',
    'Hospital',
    'Insurance',
    'Marketplace',
    'PatientDetails',
    'HandoffManager',
    'WellnessRewards',
    'PriceMedianizer',
    'ConsentSBT'
];

class ContractLoader {
    constructor() {
        this.contracts = {};
        this.errors = [];
        this.initialized = false;
    }

    log(level, message) {
        const prefixes = { info: '[INFO]', warn: '[WARN]', error: '[ERROR]', success: '[OK]' };
        console.log(`${prefixes[level] || '[INFO]'} ContractLoader: ${message}`);
    }

    findArtifact(contractName) {
        const possiblePaths = [
            path.join(CONTRACTS_BUILD_DIR, `${contractName}.json`),
            path.join(FRONTEND_CONTRACTS_DIR, `${contractName}.json`)
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return null;
    }

    getNetworkAddress(artifact) {
        const networks = artifact.networks || {};
        const preferredNetworks = ["1337", "5777", "1", "5", "11155111"];
        
        for (const networkId of preferredNetworks) {
            if (networks[networkId]?.address) {
                return networks[networkId].address;
            }
        }
        
        const keys = Object.keys(networks);
        if (keys.length > 0) {
            return networks[keys[0]].address;
        }
        
        return null;
    }

    loadContract(contractName) {
        const artifactPath = this.findArtifact(contractName);
        
        if (!artifactPath) {
            this.errors.push(`${contractName}: Artifact not found`);
            return null;
        }

        try {
            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            const address = this.getNetworkAddress(artifact);

            if (!address) {
                this.errors.push(`${contractName}: Not deployed to any network`);
                return null;
            }

            const contract = new web3.eth.Contract(artifact.abi, address);
            this.contracts[contractName] = contract;
            this.log('success', `Loaded ${contractName} at ${address}`);
            return contract;

        } catch (error) {
            this.errors.push(`${contractName}: ${error.message}`);
            return null;
        }
    }

    initialize() {
        if (this.initialized) return;

        this.log('info', 'Initializing contract loader...');
        
        const buildDir = CONTRACTS_BUILD_DIR;
        if (!fs.existsSync(buildDir)) {
            this.log('warn', `Build directory not found: ${buildDir}`);
            this.log('info', 'Please run: cd contracts && npm run deploy');
        }

        let loaded = 0;
        for (const name of REQUIRED_CONTRACTS) {
            if (this.loadContract(name)) {
                loaded++;
            }
        }

        this.initialized = true;

        if (loaded === REQUIRED_CONTRACTS.length) {
            this.log('success', `All ${loaded} contracts loaded successfully`);
        } else {
            this.log('warn', `Loaded ${loaded}/${REQUIRED_CONTRACTS.length} contracts`);
            if (this.errors.length > 0) {
                this.log('warn', 'Errors:');
                this.errors.forEach(e => this.log('error', e));
            }
        }
    }

    getContract(name) {
        if (!this.initialized) {
            this.initialize();
        }
        return this.contracts[name] || null;
    }

    isReady() {
        if (!this.initialized) this.initialize();
        return Object.keys(this.contracts).length === REQUIRED_CONTRACTS.length;
    }

    getStatus() {
        const status = {};
        for (const name of REQUIRED_CONTRACTS) {
            const contract = this.contracts[name];
            status[name] = contract ? {
                loaded: true,
                address: contract.options.address
            } : {
                loaded: false,
                error: this.errors.find(e => e.startsWith(name))
            };
        }
        return status;
    }
}

const loader = new ContractLoader();

export const initializeContracts = () => loader.initialize();
export const getContract = (name) => loader.getContract(name);
export const areContractsReady = () => loader.isReady();
export const getContractStatus = () => loader.getStatus();

export const doctorContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('Doctor');
        if (!contract) throw new Error("Doctor contract not loaded. Please ensure contracts are deployed.");
        return contract[prop];
    }
});

export const marketplaceContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('Marketplace');
        if (!contract) throw new Error("Marketplace contract not loaded.");
        return contract[prop];
    }
});

export const patientContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('Patient');
        if (!contract) throw new Error("Patient contract not loaded. Please ensure contracts are deployed.");
        return contract[prop];
    }
});

export const patientDetailsContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('PatientDetails');
        if (!contract) throw new Error("PatientDetails contract not loaded. Please ensure contracts are deployed.");
        return contract[prop];
    }
});

export const handoffManagerContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('HandoffManager');
        if (!contract) throw new Error("HandoffManager contract not loaded. Please ensure contracts are deployed.");
        return contract[prop];
    }
});

export const insuranceContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('Insurance');
        if (!contract) throw new Error("Insurance contract not loaded. Please ensure contracts are deployed.");
        return contract[prop];
    }
});

export const hospitalContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('Hospital');
        if (!contract) throw new Error("Hospital contract not loaded.");
        return contract[prop];
    }
});

export const wellnessRewardsContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('WellnessRewards');
        if (!contract) throw new Error("WellnessRewards contract not loaded.");
        return contract[prop];
    }
});

export const priceMedianizerContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('PriceMedianizer');
        if (!contract) throw new Error("PriceMedianizer contract not loaded.");
        return contract[prop];
    }
});

export const consentSBTContract = new Proxy({}, {
    get: function(target, prop) {
        const contract = loader.getContract('ConsentSBT');
        if (!contract) throw new Error("ConsentSBT contract not loaded.");
        return contract[prop];
    }
});

export default {
    initializeContracts,
    getContract,
    areContractsReady,
    getContractStatus
};
