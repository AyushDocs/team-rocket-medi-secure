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
 * Fetches a file stream from Pinata Gateway.
 */
export const getFileStream = async (hash) => {
    const gatewayUrl = `${CONFIG.PINATA.GATEWAY_URL}${hash}`;
    const response = await axios.get(gatewayUrl, { responseType: 'stream' });
    return response;
};
