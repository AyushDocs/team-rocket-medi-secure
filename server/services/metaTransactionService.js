const { ethers } = require('ethers');

class MetaTransactionService {
  constructor(contract, relayerPrivateKey, provider) {
    this.contract = contract;
    this.relayer = new ethers.Wallet(relayerPrivateKey, provider);
    this.chainId = 1; // mainnet
  }

  async getDomainSeparator() {
    return await this.contract.getDomainSeparator();
  }

  async getNonce(userAddress) {
    return await this.contract.getNonce(userAddress);
  }

  buildTransaction(sender, to, value, data, options = {}) {
    const {
      gasPrice = options.gasPrice || await this.relayer.getGasPrice(),
      gasLimit = options.gasLimit || 500000,
      deadline = options.deadline || Math.floor(Date.now() / 1000) + 3600, // 1 hour
      nonce = options.nonce
    } = options;

    return {
      from: sender,
      to: to || this.contract.address,
      value: value || 0,
      data: data || '0x',
      nonce: nonce !== undefined ? nonce : Math.floor(Math.random() * 1000000),
      gasPrice,
      gasLimit,
      deadline
    };
  }

  async signMetaTransaction(sender, tx, privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    
    const domainSeparator = await this.getDomainSeparator();
    const txHash = await this.contract.getTransactionHash(
      tx.from,
      tx.to,
      tx.value,
      tx.data,
      tx.nonce,
      tx.gasPrice,
      tx.gasLimit,
      tx.deadline
    );

    // Sign using EIP-712
    const signature = await wallet._signTypedData(
      {
        name: 'Sanjeevni',
        version: '1.0',
        chainId: this.chainId,
        verifyingContract: this.contract.address
      },
      {
        MetaTransaction: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'data', type: 'bytes' },
          { name: 'nonce', type: 'uint256' },
          { name: 'gasPrice', type: 'uint256' },
          { name: 'gasLimit', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      },
      tx
    );

    return signature;
  }

  async relayTransaction(tx, signature) {
    const gasEstimate = await this.contract.provider.estimate({
      to: tx.to,
      data: tx.data,
      value: tx.value
    });

    const gasLimit = Math.floor(gasEstimate * 1.2); // 20% buffer

    const txRequest = {
      from: tx.from,
      to: tx.to,
      value: tx.value,
      data: tx.data,
      nonce: tx.nonce,
      gasPrice: tx.gasPrice,
      gasLimit: gasLimit,
      deadline: tx.deadline
    };

    const signedTx = await this.relayer.sendTransaction({
      to: this.contract.address,
      data: this.contract.interface.encodeFunctionData(
        'executeMetaTransaction',
        [txRequest, signature]
      ),
      gasLimit
    });

    return signedTx;
  }

  async execute(sender, to, value, data, options = {}) {
    const tx = this.buildTransaction(sender, to, value, data, options);
    const signature = await this.signMetaTransaction(sender, tx, options.privateKey);
    return await this.relayTransaction(tx, signature);
  }
}

class GasStation {
  constructor(signers, threshold = 2) {
    this.signers = signers;
    this.threshold = threshold;
    this.pendingTxs = new Map();
  }

  async sponsorTransaction(tx, fee) {
    const txHash = ethers.keccak256(ethers.randomBytes(32));
    this.pendingTxs.set(txHash, { tx, fee, approvals: 0 });
    return txHash;
  }

  async approveTransaction(signer, txHash) {
    const pending = this.pendingTxs.get(txHash);
    if (!pending) throw new Error('Transaction not found');
    
    pending.approvals++;
    if (pending.approvals >= this.threshold) {
      this.pendingTxs.delete(txHash);
      return pending.tx;
    }
    return null;
  }
}

// Usage example:
/*
const relayer = new MetaTransactionService(insuranceContract, process.env.RELAYER_PRIVATE_KEY, provider);

// User builds transaction (frontend)
const tx = relayer.buildTransaction(userAddress, contractAddress, 0, data);
// Returns: { from, to, value, data, nonce, gasPrice, gasLimit, deadline }

// User signs (frontend)
// signature = await relayer.signMetaTransaction(userAddress, tx, userPrivateKey)

// Relayer executes (backend)
// result = await relayer.relayTransaction(tx, signature)
*/

module.exports = { MetaTransactionService, GasStation };