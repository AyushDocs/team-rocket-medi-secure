import "dotenv/config";
import crypto from "crypto";

const generateServiceId = () => {
    const existing = process.env.SERVICE_ID;
    if (existing) return existing;
    return `svc_${crypto.randomBytes(8).toString("hex")}`;
};

export const CONFIG = {
    SERVICE_ID: generateServiceId(),
    SERVICE_NAME: process.env.SERVICE_NAME || "medisecure-api",
    VERSION: process.env.VERSION || "2.1.0",
    PORT: process.env.PORT || 5000,
    RPC_URL: process.env.RPC_URL,
    PINATA: {
        API_KEY: process.env.PINATA_API_KEY,
        SECRET_KEY: process.env.PINATA_SECRET_API_KEY,
        GATEWAYS: [
            "https://gateway.pinata.cloud/ipfs/",
            "https://cloudflare-ipfs.com/ipfs/",
            "https://ipfs.io/ipfs/",
            "https://dweb.link/ipfs/"
        ],
        API_URL: "https://api.pinata.cloud/pinning/pinFileToIPFS"
    },
    DOCKER: {
        IMAGE: "amancevice/pandas:slim",
        MEMORY_LIMIT: 512 * 1024 * 1024,
        CPU_QUOTA: 50000,
        TEMP_DIR_NAME: "temp",
        CLEANUP_TIMEOUT: 10000
    },
    MESSAGES: {
        COMPUTE_SIG_PREFIX: "COMPUTE_EXECUTE_",
        ACCESS_DENIED: "Access denied",
        FILE_NOT_FOUND: "No file uploaded",
        MISSING_PARAMS: "Missing required parameters"
    },
    MIGRATION: {
        TABLE_NAME: "_migrations",
        LOCK_TABLE: "_migrations_lock"
    },
    JWT_SECRET: process.env.JWT_SECRET || "emergency_magic_secret_123"
};
