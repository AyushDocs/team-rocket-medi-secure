import { create } from "ipfs-http-client";
import CryptoJS from "crypto-js";

const ipfs = create({ url: "http://127.0.0.1:5001/api/v0" });

// Add or update user metadata on IPFS
export async function addOrUpdateUser(walletAddress, metadata, encryptionKey) {
  const plaintext = JSON.stringify(metadata);
  const ciphertext = CryptoJS.AES.encrypt(plaintext, encryptionKey).toString();
  const { cid } = await ipfs.add(ciphertext);
  return cid.toString();
}

// Get user metadata from IPFS
export async function getUser(cid, encryptionKey) {
  let content = "";
  for await (const chunk of ipfs.cat(cid)) {
    content += new TextDecoder().decode(chunk);
  }
  const bytes = CryptoJS.AES.decrypt(content, encryptionKey);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(plaintext);
}
