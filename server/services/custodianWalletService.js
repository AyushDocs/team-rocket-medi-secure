import crypto from "crypto";
import Web3 from "web3";

const web3 = new Web3(process.env.RPC_URL || "http://localhost:8545");

const generateDeterministicWallet = (seed) => {
  const wallet = web3.eth.accounts.privateKeyToAccount(seed);
  return wallet;
};

const createWalletForUser = (userId) => {
  const entropy = crypto.createHash("sha256").update(userId + (process.env.WALLET_SEED_SALT || "default-salt")).digest();
  const privateKey = "0x" + entropy.toString("hex");
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  
  return {
    address: account.address,
    privateKey: account.privateKey,
    publicKey: ""
  };
};

const signTransaction = async (privateKey, transaction) => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  const signedTx = await account.signTransaction(transaction);
  return signedTx;
};

const signMessage = (privateKey, message) => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  return account.sign(message).signature;
};

const signTypedData = (privateKey, domain, types, value) => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  // web3.js v4 accounts.signTypedData
  return account.signTypedData(domain, types, value).signature;
};

const getBalance = async (address) => {
  return await web3.eth.getBalance(address);
};

const sendTransaction = async (privateKey, txData) => {
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  // Use 'pending' to avoid nonce collisions during rapid transactions
  const nonce = await web3.eth.getTransactionCount(account.address, "pending");
  const gasPrice = await web3.eth.getGasPrice();
  
  const tx = {
    ...txData,
    nonce,
    gasPrice: txData.gasPrice || gasPrice,
    from: account.address
  };
  
  // Map gasLimit to gas (Web3.js uses 'gas', but sub-providers often use 'gasLimit')
  if (txData.gasLimit && !tx.gas) {
    tx.gas = txData.gasLimit;
  }
  
  if (!tx.gas) {
    try {
      tx.gas = await web3.eth.estimateGas(tx);
    } catch (e) {
      console.warn("Gas estimation failed, using default 1,000,000:", e.message);
      tx.gas = 1000000;
    }
  }
  
  console.log(`Sending custodian transaction from ${account.address} to ${tx.to} (nonce: ${nonce})`);
  
  try {
      const signedTx = await account.signTransaction(tx);
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      
      console.log(`Transaction successful: ${receipt.transactionHash}`);
      return receipt;
  } catch (error) {
      // Try to extract revert reason
      if (error.receipt && error.receipt.status === 0n) {
          console.error(`Transaction REVERTED: ${error.receipt.transactionHash}`);
          // Attempt to get reason via call
          try {
              await web3.eth.call(tx, tx.blockNumber);
          } catch (callError) {
              console.error("Revert Reason:", callError.message);
              error.message = `Revert Reason: ${callError.message}`;
          }
      }
      throw error;
  }
};

const sendETH = async (privateKey, toAddress, amount) => {
  return await sendTransaction(privateKey, {
    to: toAddress,
    value: web3.utils.toWei(amount.toString(), "ether")
  });
};

const seedWallet = async (toAddress) => {
  if (process.env.NODE_ENV !== "development" && !process.env.FAUCET_PRIVATE_KEY) return;
  
  try {
    const balance = await getBalance(toAddress);
    if (BigInt(balance) === 0n) {
      console.log(`Seeding wallet ${toAddress} with 1 ETH...`);
      
      const faucetKey = process.env.FAUCET_PRIVATE_KEY;
      if (faucetKey) {
        await sendETH(faucetKey, toAddress, 1);
      } else {
        // Fallback: Use unlocked accounts[0] which is standard for local Ganache
        const accounts = await web3.eth.getAccounts();
        if (accounts && accounts.length > 0) {
            await web3.eth.sendTransaction({
                from: accounts[0],
                to: toAddress,
                value: web3.utils.toWei("1", "ether")
            });
            console.log(`Successfully seeded ${toAddress} using unlocked account ${accounts[0]}`);
        } else {
            console.warn("No faucet key or unlocked accounts available for seeding.");
        }
      }
    }
  } catch (error) {
    console.error("Failed to seed wallet:", error);
  }
};

export {
  createWalletForUser,
  signTransaction,
  signMessage,
  signTypedData,
  sendTransaction,
  getBalance,
  sendETH,
  seedWallet,
  generateDeterministicWallet
};