import { ethers } from "ethers";

export class ManagedSigner extends ethers.AbstractSigner {
    constructor(address, provider, userId) {
        super(provider);
        this.address = address;
        this.userId = userId;
    }

    async getAddress() {
        return this.address;
    }

    async signMessage(message) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/sign-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, message })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to sign message");
        return data.signature;
    }

    async signTransaction(transaction) {
        throw new Error("signTransaction not supported by ManagedSigner. Use sendTransaction instead.");
    }

    async signTypedData(domain, types, value) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/sign-typed-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, domain, types, value })
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to sign typed data");
        return data.signature;
    }

    async sendTransaction(transaction) {
        const txData = {
            to: transaction.to,
            data: transaction.data,
            value: transaction.value ? transaction.value.toString() : "0",
            gasLimit: transaction.gasLimit ? transaction.gasLimit.toString() : "1000000",
            gasPrice: transaction.gasPrice ? transaction.gasPrice.toString() : undefined,
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/v1/custodian/send-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: this.userId, txData })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Failed to send transaction via custodian");
        
        const txHash = data.transactionHash;

        const txResponse = {
            hash: txHash,
            to: transaction.to,
            from: this.address,
            data: transaction.data || "0x",
            value: transaction.value ? BigInt(transaction.value.toString()) : 0n,
            chainId: (await this.provider.getNetwork()).chainId,
            confirmations: 0,
            nonce: await this.provider.getTransactionCount(this.address),
            gasLimit: BigInt(txData.gasLimit),
            gasPrice: txData.gasPrice ? BigInt(txData.gasPrice) : undefined,
            type: 0,
            blockNumber: null,
            blockHash: null,
            wait: async (confirms) => {
                console.log(`Waiting for tx: ${txHash}`);
                const receipt = await this.provider.waitForTransaction(txHash, confirms);
                return receipt;
            }
        };

        return txResponse;
    }

    connect(provider) {
        return new ManagedSigner(this.address, provider, this.userId);
    }
}
