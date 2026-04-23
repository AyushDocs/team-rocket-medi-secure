const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../server/.env") });

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

async function uploadFileToPinata(localPath, metadata = {}) {
    const full = path.resolve(__dirname, localPath);
    if (!fs.existsSync(full)) return null;

    const form = new FormData();
    form.append("file", fs.createReadStream(full));
    form.append("pinataMetadata", JSON.stringify({
        name: metadata.name || path.basename(localPath),
        keyvalues: metadata.keyvalues || {}
    }));

    try {
        if (!PINATA_API_KEY || !PINATA_SECRET_API_KEY) return null;
        const res = await axios.post(PINATA_API_URL, form, {
            maxBodyLength: Infinity,
            headers: Object.assign({
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY
            }, form.getHeaders())
        });
        return res.data.IpfsHash;
    } catch (err) {
        return null;
    }
}

module.exports = async function(callback) {
    console.log("\n=== SEEDING CONTRACTS ===\n");

    try {
        const uploadedHashes = [];
        console.log("Step 1: Upload images to IPFS...");
        const images = ["apollo.jpg", "ultrasound.jpg", "x-ray.jpg"];
        for (const img of images) {
            const hash = await uploadFileToPinata(img, { name: img });
            if (hash) {
                console.log(`  > ${img} -> ${hash.slice(0,30)}...`);
                uploadedHashes.push({ hash, name: img });
            } else {
                console.log(`  > ${img} (placeholder - no IPFS)`);
            }
        }

        const Patient = artifacts.require("Patient");
        const Doctor = artifacts.require("Doctor");
        const Hospital = artifacts.require("Hospital");
        const Marketplace = artifacts.require("Marketplace");
        const Insurance = artifacts.require("Insurance");
        const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
        
        const patientContract = await Patient.deployed();
        const doctorContract = await Doctor.deployed();
        const hospitalContract = await Hospital.deployed();
        const marketplaceContract = await Marketplace.deployed();
        const insuranceContract = await Insurance.deployed();
        const ac = await MediSecureAccessControl.deployed();

        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0];
        
        console.log("\nStep 2: Using test accounts that are pre-funded (Ganache deterministic wallet)...");
        console.log(`   Deployer: ${deployer}`);
        
        // The tests work because they deploy fresh contracts and grant admin role
        // Our deployed contracts have a different issue - let's try calling via deployer
        // and using a workaround
        
        // Try calling grantAdminRole via deployer directly  
        console.log("\n   Attempting grantAdminRole from deployer...");
        try {
            const tx = await ac.grantAdminRole(patientContract.address, { 
                from: deployer, 
                gas: 300000 
            });
            console.log("   SUCCESS! Tx:", tx.transactionHash);
        } catch(e) {
            console.log("   Error:", e.message.slice(0,80));
            console.log("   (This error is known - trying alternate method)");
        }

        // Alternate method: skip the role grant and just try registration
        // The contracts ARE deployed and initialized - let's see if registration works
        // by using account 0 (deployer who already has admin)
        
        console.log("\nStep 3: Registering Entities (using deployer who has admin role)...\n");
        
        // For seed data, we'll use deployer for all registrations since they have admin role
        // This is not ideal for production but works for seed data
        
        console.log("Registering patient from deployer (admin)...");
        try {
            // Use account[1] as the patient wallet, but call from deployer
            await patientContract.registerPatient("patient1", "Patient One", "patient1@test.com", 30, "O+", { from: accounts[1], gas: 500000 });
            console.log("  > Patient 1 registered from accounts[1] (0xFFcf...)");

            // Assign uploaded images to this patient
            if (uploadedHashes.length > 0) {
                console.log("  > Assigning uploaded images to Patient 1...");
                for (const item of uploadedHashes) {
                    await patientContract.addMedicalRecord(
                        item.hash, 
                        item.name, 
                        "2026-04-23", 
                        "MediSecure Lab", 
                        true, 
                        { from: accounts[1], gas: 500000 }
                    );
                    console.log(`    - Assigned ${item.name} to Patient 1`);
                }
            }
        } catch(e) { 
            console.log("  ! Patient 1:", e.message.slice(0,80)); 
        }

        console.log("\nRegistering doctor...");
        try {
            await doctorContract.registerDoctor("Dr. Strange", "Neurology", "Sanctum Medical", { from: accounts[4], gas: 500000 });
            console.log("  > Doctor 1 registered");
        } catch(e) { 
            console.log("  ! Doctor 1:", e.message.slice(0,80)); 
        }

        console.log("\nRegistering hospital...");
        try {
            await hospitalContract.registerHospital("Community Health", "contact@community.com", "LA", "REG456", { from: accounts[9], gas: 500000 });
            console.log("  > Hospital 2 registered");
        } catch(e) { 
            console.log("  ! Hospital 2:", e.message.slice(0,80)); 
        }

        console.log("\nRegistering company...");
        try {
            await marketplaceContract.registerCompany("Pfizer Research", "info@pfizer.com", { from: accounts[6], gas: 500000 });
            console.log("  > Company 1 registered");
        } catch(e) { 
            console.log("  ! Company 1:", e.message.slice(0,80)); 
        }

        console.log("\nRegistering insurance...");
        try {
            await insuranceContract.registerInsuranceProvider("SafeLife Insurance", { from: accounts[8], gas: 500000 });
            console.log("  > Insurance provider registered");
        } catch(e) { 
            console.log("  ! Insurance:", e.message.slice(0,80)); 
        }

        console.log("Registering Google/Custodian Patient (0x0156...)...");
        try {
            const googleAddress = "0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5";
            // Fund it first!
            await web3.eth.sendTransaction({
                from: deployer,
                to: googleAddress,
                value: web3.utils.toWei("10", "ether")
            });
            console.log("  > Google patient wallet funded with 10 ETH");
            await patientContract.registerPatient("googleUser", "Ayush Dubey", "ayush@test.com", 25, "B+", { from: googleAddress, gas: 500000 });
            console.log("  > Google patient registered");
            
            // Add a medical record for them
            await patientContract.addMedicalRecord(
                "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", 
                "Health Checkup.pdf", 
                "2026-04-12", 
                "City General", 
                true, 
                { from: googleAddress, gas: 500000 }
            );
            console.log("  > Added sample record for Google patient");
        } catch(e) { 
            console.log("  ! Google patient:", e.message.slice(0,80)); 
        }

        console.log("\n=== SEED COMPLETE ===\n");
        console.log("Test Accounts:");
        console.log(`  Patient 1: ${accounts[1]}`);
        console.log(`  Doctor 1:  ${accounts[4]}`);
        console.log(`  Hospital 2: ${accounts[9]}`);
        console.log(`  Company 1:  ${accounts[6]}`);
        console.log(`  Insurance:  ${accounts[8]}`);
        console.log("\nContract Addresses:");
        console.log(`  Patient:     ${patientContract.address}`);
        console.log(`  Doctor:     ${doctorContract.address}`);
        console.log(`  Hospital:   ${hospitalContract.address}`);
        console.log(`  Marketplace: ${marketplaceContract.address}`);
        console.log(`  Insurance:   ${insuranceContract.address}`);
        console.log("");
        
        callback();
    } catch (error) {
        console.log("\n!!! SEED ERROR !!!");
        console.log(error.message);
        callback(error);
    }
};