import crypto from "crypto";
import Web3 from "web3";

const web3 = new Web3();

const createWalletForUser = (userId) => {
  try {
    const entropy = crypto.createHash("sha256").update(userId + "default-salt").digest();
    const privateKey = "0x" + entropy.toString("hex");
    console.log("Generated PK:", privateKey);
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    
    return {
      address: account.address,
      privateKey: account.privateKey,
    };
  } catch (e) {
    console.error("Internal Error:", e);
    throw e;
  }
};

try {
  const wallet = createWalletForUser("test-user");
  console.log("Wallet:", wallet);
} catch (e) {
  console.error("Final Error:", e);
}
