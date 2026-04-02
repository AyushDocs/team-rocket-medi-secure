import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import { CONFIG } from "../config/constants.js";

/**
 * Uploads a file buffer to Pinata IPFS.
 */
export const uploadToIPFS = async (fileBuffer, fileName, userAddress) => {
    // Ensure metadata is clean
    const safeName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

    const metadata = JSON.stringify({
        name: safeName,
        keyvalues: {
            owner: userAddress
        }
    });

    const pinataOptions = JSON.stringify({
        cidVersion: 0
    });

    const formData = new FormData();
    const stream = Readable.from(fileBuffer);
    
    formData.append('file', stream, {
        filename: safeName,
        knownLength: fileBuffer.length
    });
    
    formData.append('pinataMetadata', metadata);
    formData.append('pinataOptions', pinataOptions);
    
    const response = await axios.post(
        CONFIG.PINATA.API_URL,
        formData,
        {
            maxBodyLength: Infinity,
            timeout: 300000,
            headers: {
                ...formData.getHeaders(),
                'pinata_api_key': CONFIG.PINATA.API_KEY,
                'pinata_secret_api_key': CONFIG.PINATA.SECRET_KEY
            }
        }
    );

    return response.data.IpfsHash;
};

/**
 * Fetches a file stream from Pinata Gateway with retries and timeout.
 */
export const getFileStream = async (hash) => {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const gateway = CONFIG.PINATA.GATEWAYS[0];
            const gatewayUrl = `${gateway}${hash}`;
            console.log(`[ipfsService] Attempt ${attempt}: Fetching ${gatewayUrl}`);
            
            const response = await axios.get(gatewayUrl, { 
                responseType: 'stream',
                timeout: 30000
            });
            console.log(`[ipfsService] Success fetching hash: ${hash}`);
            return response;
        } catch (err) {
            lastError = err;
            console.error(`[ipfsService] Attempt ${attempt} failed:`, err.message, err.code);
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    throw new Error(`Failed to fetch from IPFS after ${maxRetries} attempts: ${lastError.message}`);
};
