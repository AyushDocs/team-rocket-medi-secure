
import Web3 from "web3";
import fs from "fs";

const web3 = new Web3("http://localhost:8545");
const patientJson = JSON.parse(fs.readFileSync("./contracts/Patient.json", "utf8"));
const patientAddress = patientJson.networks["1337"].address;

const patientContract = new web3.eth.Contract(patientJson.abi, patientAddress);

async function register() {
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];
    const userToRegister = "0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5";
    
    console.log(`Registering ${userToRegister} as patient...`);
    
    // We need to send from the user's address? 
    // No, normally they register themselves. 
    // But since I don't have their private key easily here (it's derived), 
    // I'll use the faucet logic to send it?
    
    // Actually, I'll just derive the private key like the custodian service does!
    // createWalletForUser(userId)
    // userId was yjzn3Y9wRgMg299nx1IvBltJy1x2
    
    const userId = "yjzn3Y9wRgMg299nx1IvBltJy1x2";
    const salt = "default-salt"; // Hardcoded in custodianWalletService.js
    import crypto from "crypto";
    const entropy = crypto.createHash("sha256").update(userId + salt).digest();
    const privateKey = "0x" + entropy.toString("hex");
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log(`Derived address: ${account.address}`);
    
    if (account.address.toLowerCase() !== userToRegister.toLowerCase()) {
        console.error("Address mismatch!");
        return;
    }
    
    // Check balance
    const balance = await web3.eth.getBalance(account.address);
    if (BigInt(balance) === 0n) {
        console.log("Seeding with faucet...");
        await web3.eth.sendTransaction({
            from: deployer,
            to: account.address,
            value: web3.utils.toWei("1", "ether")
        });
    }
    
    const tx = patientContract.methods.registerPatient(
        "google_user",
        "Google User",
        "google@user.com",
        25,
        "A+"
    );
    
    const gas = await tx.estimateGas({ from: account.address });
    const signedTx = await account.signTransaction({
        to: patientAddress,
        data: tx.encodeABI(),
        gas,
        gasPrice: await web3.eth.getGasPrice()
    });
    
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Registration successful! Hash: ${receipt.transactionHash}`);
    
    const pId = await patientContract.methods.walletToPatientId(account.address).call();
    console.log(`New Patient ID: ${pId.toString()}`);
}

register().catch(console.error);
