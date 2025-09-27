import { Web3Storage, File } from 'web3.storage';
import fs from 'fs';
import path from 'path';

// 1. Create a Web3.Storage client using your API token
const token = 'MgCb+3IaLlb39USI28C1eY7pSA6b67y5Fi+C00QMDIFhiju0BDSdSeOGVQJPrauseFFXgOq9dOMVyNS0E3neAORu+jwI=';  // replace with your Web3.Storage API key
const client = new Web3Storage({ token });

// 2. Read the file you want to upload
const filePath = path.join(process.cwd(), 'example.txt'); // your file path
const fileContent = fs.readFileSync(filePath);
const files = [new File([fileContent], 'example.txt')];

// 3. Upload
async function upload() {
  const cid = await client.put(files);
  console.log('File uploaded! CID:', cid);
}

upload();
