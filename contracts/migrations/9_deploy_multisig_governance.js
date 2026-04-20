const MultiSigWallet = artifacts.require("MultiSigWallet");
const path = require("path");
const fs = require("fs");

module.exports = async function (deployer, network, accounts) {
    console.log("\n=== Deploying Multi-Sig Governance ===\n");

    // Deploy Multi-Sig Wallet with 3 owners (2/3 threshold)
    console.log("1. Deploying MultiSigWallet...");
    const owners = [accounts[0], accounts[1], accounts[2]];
    const threshold = 2;

    // Use deployer.deploy so the artifact is registered for migration 10
    await deployer.deploy(MultiSigWallet, owners, threshold);
    const multiSig = await MultiSigWallet.deployed();
    console.log(`   MultiSig Wallet: ${multiSig.address}`);
    
    // Fund Multi-Sig with some ETH
    const fundingAmount = web3.utils.toWei("0.5", "ether");
    await web3.eth.sendTransaction({
        from: accounts[0],
        to: multiSig.address,
        value: fundingAmount
    });
    console.log(`   Funded with 0.5 ETH`);

    console.log("\n=== Multi-Sig Summary ===");
    console.log(`MultiSig Wallet: ${multiSig.address}`);
    console.log(`Owners: ${owners.join(", ")}`);
    console.log(`Threshold: ${threshold} of ${owners.length}`);

    // Verify it works
    console.log("\n2. Testing MultiSig...");
    const isOwner0 = await multiSig.isOwner(accounts[0]);
    const isOwner1 = await multiSig.isOwner(accounts[1]);
    const isOwner2 = await multiSig.isOwner(accounts[2]);
    console.log(`   Owner[0]: ${isOwner0}`);
    console.log(`   Owner[1]: ${isOwner1}`);
    console.log(`   Owner[2]: ${isOwner2}`);

    // Save Artifacts for Frontend and Server
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
    
    [frontendPath, serverPath].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    const contractData = MultiSigWallet.toJSON();
    if (!contractData.networks) contractData.networks = {};
    contractData.networks[networkId] = {
        address: multiSig.address,
        transactionHash: multiSig.transactionHash
    };
    fs.writeFileSync(path.join(frontendPath, 'MultiSigWallet.json'), JSON.stringify(contractData, null, 2));
    fs.writeFileSync(path.join(serverPath, 'MultiSigWallet.json'), JSON.stringify(contractData, null, 2));
    console.log(`MultiSigWallet synced to frontend and server.`);
};