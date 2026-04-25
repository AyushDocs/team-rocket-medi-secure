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
    if (!fs.existsSync(full)) {
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, `Sanjeevni Data Asset\nName: ${metadata.name || path.basename(localPath)}\nTS: ${Date.now()}`);
    }

    const form = new FormData();
    form.append("file", fs.createReadStream(full));
    form.append("pinataMetadata", JSON.stringify({ name: metadata.name || path.basename(localPath) }));

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
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║          SANJEEVNI ECOSYSTEM SEEDING ENGINE                ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    try {
        const uploadedHashes = [];
        console.log("Step 1: Upload images to IPFS...");
        const images = ["apollo.jpg", "ultrasound.jpg", "x-ray.jpg"];
        
        // Fallback hashes in case Pinata is not configured or fails
        const fallbackHashes = {
            "apollo.jpg": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
            "ultrasound.jpg": "QmYwAP7Bv9K279L1Uj76NfS7Qd47E4Z79L1Uj76NfS7Qd4",
            "x-ray.jpg": "QmZ4tj3p9f9N79L1Uj76NfS7Qd47E4Z79L1Uj76NfS7Qd4"
        };

        for (const img of images) {
            const hash = await uploadFileToPinata(img, { name: img });
            if (hash) {
                console.log(`  > ${img} -> ${hash.slice(0,30)}...`);
                uploadedHashes.push({ hash, name: img });
            } else {
                console.log(`  > ${img} (using fallback hash)`);
                uploadedHashes.push({ hash: fallbackHashes[img], name: img });
            }
        }

        const Patient = artifacts.require("Patient");
        const Doctor = artifacts.require("Doctor");
        const Hospital = artifacts.require("Hospital");
        const Marketplace = artifacts.require("Marketplace");
        const Insurance = artifacts.require("Insurance");
        const SanjeevniToken = artifacts.require("SanjeevniToken");
        
        const patientContract = await Patient.deployed();
        const doctorContract = await Doctor.deployed();
        const hospitalContract = await Hospital.deployed();
        const marketplaceContract = await Marketplace.deployed();
        const insuranceContract = await Insurance.deployed();
        const tokenContract = await SanjeevniToken.deployed();

        const accounts = await web3.eth.getAccounts();
        const deployer = accounts[0];
        const patient1 = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"; 
        const drStrange = accounts[2];
        const hospitalAddr = accounts[7];
        const companyAddr = accounts[9];

        console.log("\nStep 2: Universal Funding...");
        for (const acc of [patient1, hospitalAddr, companyAddr, drStrange]) {
            await web3.eth.sendTransaction({ from: deployer, to: acc, value: web3.utils.toWei("2", "ether") });
        }

        console.log("\nStep 3: Component Registration...");
        try {
            await patientContract.registerPatient("patient1", "Ayush Dubey", "ayush@sanjeevni.com", 24, "B+", { from: patient1 });
            await doctorContract.registerDoctor("Dr. Stephen Strange", "Neurology", "Sanctum", { from: drStrange });
            await hospitalContract.registerHospital("City General", "hosp@city.com", "Main St", "H123", { from: hospitalAddr });
            await marketplaceContract.registerCompany("Global Pharma Corp", "research@globalpharma.com", { from: companyAddr });
            await insuranceContract.registerInsuranceProvider("SafeLife Insurance", { from: accounts[8], gas: 500000 });
            console.log("  > Registered Entities: Patient, Doctor, Hospital, Marketplace Company, Insurance.");
        } catch(e) {
            console.log("  ! Registration info:", e.message.slice(0, 50));
        }

        console.log("\nStep 4: Populating Marketplace Data Banks...");
        // Fund the company with tokens for offers
        const sanjBudget = web3.utils.toWei("5000", "ether");
        await tokenContract.transfer(companyAddr, sanjBudget, { from: deployer });
        await tokenContract.approve(marketplaceContract.address, sanjBudget, { from: companyAddr });
        
        const offers = [
            { title: "Neuro-Degenerative Research 2026", desc: "Seeking Brain MRI data for Alzheimer's early detection study. Rewards in SANJ tokens.", price: web3.utils.toWei("50", "ether") },
            { title: "Cardiovascular Trend Analysis", desc: "Correlate heart rate variability with long-term recovery. Rewards in SANJ tokens.", price: web3.utils.toWei("25", "ether") },
            { title: "Genomic Sequencing Dataset", desc: "Large scale mapping of B+ blood groups in South Asia. Rewards in SANJ tokens.", price: web3.utils.toWei("100", "ether") }
        ];

        for (const o of offers) {
            try {
                await marketplaceContract.createOffer(o.title, o.desc, o.price, true, { from: companyAddr });
                console.log(`  > Marketplace Offer Created (SANJ): ${o.title}`);
            } catch(e) { console.log(`  ! Offer failed: ${e.message.slice(0, 50)}`); }
        }

        console.log("\nStep 5: Syncing Records & Seeding Participation...");
        const h = await uploadFileToPinata(`./dummy_files/MRI_Final.pdf`, { name: "MRI_Final.pdf" }) || "QmZ4tj3p9f9N79L1Uj76NfS7Qd47E4Z79L1Uj76NfS7Qd4";
        await patientContract.addMedicalRecord(h, "MRI_Final.pdf", "2026-04-20", "Apollo", true, { from: patient1 });
        
        // Sell data to the first offer to seed participation
        const firstOffer = await marketplaceContract.offers(1);
        if (firstOffer.isActive) {
            await marketplaceContract.sellData(1, h, { from: patient1 });
            console.log("  > Seeded Participation: MRI_Final sold to 'Neuro-Degenerative Research 2026'");
        }

        console.log("\nStep 6: Registering Google/Custodian Patient...");
        try {
            const googleAddress = "0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5";
            await web3.eth.sendTransaction({
                from: deployer,
                to: googleAddress,
                value: web3.utils.toWei("10", "ether")
            });
            await patientContract.registerPatient("googleUser", "Ayush Dubey", "ayush@test.com", 25, "B+", { from: googleAddress, gas: 500000 });
            console.log("  > Google patient registered & funded.");
        } catch(e) {}

        console.log("\n╔════════════════════════════════════════════════════════════╗");
        console.log("║          MARKETPLACE POPULATED - DATA BANKS LIVE           ║");
        console.log("╚════════════════════════════════════════════════════════════╝\n");

        
        callback();
    } catch (error) {
        console.log("\n!!! SEED ERROR !!!");
        console.log(error.message);
        callback(error);
    }
};