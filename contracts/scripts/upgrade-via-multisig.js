/**
 * Upgrade script that requires Multi-Sig approval
 * 
 * This script demonstrates how to use Multi-Sig for contract upgrades:
 * 1. Propose upgrade via Multi-Sig
 * 2. Get approval from other owners
 * 3. Execute the upgrade
 */

const { ethers, upgrades } = require("hardhat");
const MultiSigWallet = require("./build/contracts/MultiSigWallet.json");

const PROXY_ADDRESSES = {
    Patient: "0x718e1497188318aDdf7e38b8318747006541F888",
    Doctor: "0x32e02F2934824ec085298E2B4e0e07935Ec6DaeC",
    Insurance: "0x6082Ac385d4c63be87d5146b3c43E5E826A7341C"
};

const MULTISIG_ADDRESS = "0xf2362FB814015A95ffe5E6C0BE51359803ede1cA";

// Derived addresses from mnemonic (Ganache deterministic)
const OWNER_ADDRESSES = [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0", 
    "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b"
];

const PRIVATE_KEYS = [
    "0x4f3edf983f6a4373f5923e36c1780e719fc592a5e8e5e3e3b8f5c1d3f1c3b5a",
    "0x7a0edf8a4e2e3f5d6c1e8f3a4d2b8f7e9c5d3f1a8b7e4c9d6f3e2a1b0c9d8e7",
    "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
];

async function proposeUpgrade(contractName, newImplementation, signer) {
    const proxyAddress = PROXY_ADDRESSES[contractName];
    console.log(`\nProposing upgrade for ${contractName}...`);
    console.log(`   Proxy: ${proxyAddress}`);
    console.log(`   New Implementation: ${newImplementation}`);
    
    // Create upgrade call data
    const upgradeData = ethers.concat([
        "0x3659cbe6", // upgrade(address)
        ethers.zeroPadValue(newImplementation, 32)
    ]);
    
    // Submit to multi-sig
    const multiSig = await ethers.getContractAt("MultiSigWallet", MULTISIG_ADDRESS, signer);
    
    // Get current nonce
    const nonce = await multiSig.nonce();
    
    // Encode transaction data
    const txData = upgradeData;
    
    // Submit transaction
    const tx = await multiSig.submitTransaction(proxyAddress, 0n, txData);
    const receipt = await tx.wait();
    
    // Find the tx hash from events
    const submitEvent = receipt.logs.find(log => {
        try {
            return log.fragment && log.fragment.name === "TransactionSubmitted";
        } catch {
            return false;
        }
    });
    
    console.log(`   Transaction submitted!`);
    return receipt.hash;
}

async function confirmTransaction(txHash, signer) {
    console.log(`\nConfirming transaction...`);
    const multiSig = await ethers.getContractAt("MultiSigWallet", MULTISIG_ADDRESS, signer);
    const tx = await multiSig.confirmTransaction(txHash);
    await tx.wait();
    console.log(`   Transaction confirmed!`);
}

async function executeUpgrade(txHash, signer) {
    console.log(`\nExecuting upgrade...`);
    const multiSig = await ethers.getContractAt("MultiSigWallet", MULTISIG_ADDRESS, signer);
    const tx = await multiSig.executeTransaction(txHash);
    await tx.wait();
    console.log(`   Upgrade executed!`);
}

async function main() {
    console.log("=== Multi-Sig Contract Upgrade ===\n");
    console.log(`MultiSig: ${MULTISIG_ADDRESS}`);
    console.log(`\nAddresses:`);
    console.log(`  Owner 0: ${OWNER_ADDRESSES[0]}`);
    console.log(`  Owner 1: ${OWNER_ADDRESSES[1]}`);
    console.log(`  Owner 2: ${OWNER_ADDRESSES[2]}`);

    // Get signers (simulating different owners)
    const [owner0, owner1, owner2] = await ethers.getSigners();
    
    // Step 1: Deploy new implementation
    console.log("\n--- Step 1: Deploy new implementation ---");
    const PatientV2 = await ethers.getContractFactory("PatientUpgradeable");
    const newImpl = await PatientV2.deploy();
    await newImpl.waitForDeployment();
    const newImplAddress = await newImpl.getAddress();
    console.log(`New implementation: ${newImplAddress}`);
    
    // Step 2: Owner 0 proposes the upgrade
    console.log("\n--- Step 2: Owner 0 proposes upgrade ---");
    const txHash0 = await proposeUpgrade("Patient", newImplAddress, owner0);
    
    // Step 3: Owner 1 confirms (reaching threshold of 2)
    console.log("\n--- Step 3: Owner 1 confirms ---");
    await confirmTransaction(txHash0, owner1);
    
    // Step 4: Execute the upgrade
    console.log("\n--- Step 4: Execute upgrade ---");
    await executeUpgrade(txHash0, owner2);
    
    console.log("\n=== Upgrade Complete ===");
    console.log("The contract has been upgraded via multi-sig approval!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });