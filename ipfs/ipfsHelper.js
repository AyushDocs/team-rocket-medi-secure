// ipfsHelpers.js
import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js"; // Optional: install with `npm i crypto-js`

// Initialize IPFS client
const ipfs = create({ url: "http://127.0.0.1:5001/api/v0" });

// --- AES Encryption Helpers ---
export function encryptData(jsonData, key) {
    return CryptoJS.AES.encrypt(JSON.stringify(jsonData), key).toString();
}

export function decryptData(encryptedStr, key) {
    const bytes = CryptoJS.AES.decrypt(encryptedStr, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// --- Add or update user metadata on IPFS ---
export async function addOrUpdateUser(walletAddress, metadata, encryptionKey) {
    let dataToStore = metadata;

    if (encryptionKey) {
        dataToStore = encryptData(metadata, encryptionKey);
    }

    const { cid } = await ipfs.add(JSON.stringify(dataToStore));
    return cid.toString(); // Returns IPFS CID
}

// --- Retrieve user metadata from IPFS ---
export async function getUser(walletAddress, cid, encryptionKey) {
    if (!cid) return null;

    const decoder = new TextDecoder();
    let content = '';

    for await (const chunk of ipfs.cat(cid)) {
        content += decoder.decode(chunk, { stream: true });
    }

    const data = JSON.parse(content);

    if (encryptionKey) {
        return decryptData(data, encryptionKey);
    }
    return data;
}

// --- Optional: Delete user (local only, IPFS immutable) ---
export function deleteUser(walletAddress, localMap) {
    if (localMap) {
        localMap.delete(walletAddress);
    }
}
