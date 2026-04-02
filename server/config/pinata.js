import pinataSDK from "@pinata/sdk";
import { CONFIG } from "./constants.js";

const pinata = new pinataSDK(
  CONFIG.PINATA.API_KEY,
  CONFIG.PINATA.SECRET_KEY
);

// Verify Pinata Connection
pinata.testAuthentication().then((result) => {
    console.log("Pinata Connected:", result);
}).catch((err) => {
    console.error("Pinata Connection Failed:", err);
});

export default pinata;
