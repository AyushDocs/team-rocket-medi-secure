import axios from "axios";
import fse from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { CONFIG } from "../config/constants.js";
import docker from "../config/docker.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const executeComputeJob = async (userAddress, ipfsHashes, script) => {
    const jobId = uuidv4();
    const tempDir = path.join(__dirname, "../", CONFIG.DOCKER.TEMP_DIR_NAME, jobId);
    const dataDir = path.join(tempDir, "data");
    const outputDir = path.join(tempDir, "outputs");

    try {
        console.log(`[Job ${jobId}] Starting compute job for ${userAddress}`);

        await fse.ensureDir(dataDir);
        await fse.ensureDir(outputDir);

        // Download data
        for (let hash of ipfsHashes) {
            // Safety check: ensure hash is a valid string
            if (!hash || typeof hash !== 'string') {
                console.warn(`[Job ${jobId}] Skipping invalid hash:`, hash);
                continue;
            }

            // Sanitize hash: remove ipfs:// prefix if present
            hash = hash.trim();
            if (hash.startsWith("ipfs://")) {
                hash = hash.replace("ipfs://", "");
            }

            let downloaded = false;
            const gateways = CONFIG.PINATA.GATEWAYS || ["https://gateway.pinata.cloud/ipfs/"];

            for (const gateway of gateways) {
                const gatewayUrl = `${gateway}${hash}`;
                console.log(`[Job ${jobId}] Attempting download from: ${gatewayUrl}`);
                
                try {
                    const response = await axios.get(gatewayUrl, { 
                        responseType: 'arraybuffer',
                        timeout: 15000, // 15s per gateway
                        headers: { 'Accept': '*/*' }
                    });
                    
                    const contentType = response.headers["content-type"];
                    let ext = ".dat";
                    if (contentType && contentType.includes("csv")) ext = ".csv";
                    if (contentType && contentType.includes("json")) ext = ".json";
                    if (contentType && contentType.includes("text/plain")) ext = ".txt";

                    // Ensure filename is safe for the filesystem
                    const safeName = hash.replace(/[^a-z0-9]/gi, '_');
                    await fse.writeFile(path.join(dataDir, `${safeName}${ext}`), response.data);
                    console.log(`[Job ${jobId}] Successfully downloaded: ${safeName}${ext} from ${gateway}`);
                    downloaded = true;
                    break; // Success! Exit gateway loop
                } catch (axiosError) {
                    console.warn(`[Job ${jobId}] Gateway ${gateway} failed: ${axiosError.message}`);
                    continue; // Try next gateway
                }
            }

            if (!downloaded) {
                throw new Error(`Failed to download dataset ${hash} from all available gateways.`);
            }
        }

        const scriptPath = path.join(tempDir, "train.py");
        await fse.writeFile(scriptPath, script);

        // Ensure image exists
        const images = await docker.listImages({ filters: { reference: [CONFIG.DOCKER.IMAGE] } });
        if (images.length === 0) {
            console.log(`[Job ${jobId}] Image ${CONFIG.DOCKER.IMAGE} not found. Pulling...`);
            await new Promise((resolve, reject) => {
                docker.pull(CONFIG.DOCKER.IMAGE, (err, stream) => {
                    if (err) return reject(err);
                    docker.modem.followProgress(stream, onFinished, onProgress);
                    function onFinished(err, output) {
                        if (err) return reject(err);
                        resolve(output);
                    }
                    function onProgress(event) {
                        // console.log(event.status);
                    }
                });
            });
            console.log(`[Job ${jobId}] Image pulled successfully.`);
        }

        let logs = "";
        const container = await docker.createContainer({
            Image: CONFIG.DOCKER.IMAGE,
            Cmd: ["python", "/app/train.py"],
            HostConfig: {
                Binds: [
                    `${path.resolve(dataDir)}:/data:ro`,
                    `${path.resolve(outputDir)}:/outputs`,
                    `${path.resolve(scriptPath)}:/app/train.py:ro`
                ],
                Memory: CONFIG.DOCKER.MEMORY_LIMIT,
                CpuQuota: CONFIG.DOCKER.CPU_QUOTA,
                NetworkMode: "none"
            },
            WorkingDir: "/app"
        });

        await container.start();
        
        const stream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true
        });

        await new Promise((resolve, reject) => {
            container.modem.demuxStream(stream, {
                write: (chunk) => { logs += chunk.toString(); },
            }, {
                write: (chunk) => { logs += chunk.toString(); },
            });
            
            container.wait((err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });

        const inspect = await container.inspect();
        const exitCode = inspect.State.ExitCode;
        await container.remove();

        const outputFiles = await fse.readdir(outputDir);
        const results = {};
        for (const file of outputFiles) {
            if (file.endsWith(".json") || file.endsWith(".txt")) {
                results[file] = await fse.readFile(path.join(outputDir, file), "utf8");
            }
        }

        return {
            jobId,
            exitCode,
            logs,
            results,
            status: exitCode === 0 ? "success" : "failed"
        };

    } finally {
        // Cleanup temp files
        setTimeout(async () => {
            try {
                await fse.remove(tempDir);
            } catch (e) {
                console.error(`[Job ${jobId}] Cleanup failed:`, e);
            }
        }, CONFIG.DOCKER.CLEANUP_TIMEOUT);
    }
};
