const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Marketplace = artifacts.require("Marketplace");

module.exports = async function(callback) {
  try {
    const patientContract = await Patient.deployed();
    const doctorContract = await Doctor.deployed();
    const marketplaceContract = await Marketplace.deployed();

    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    // --- ROLES SETUP ---
    // Patients: Accounts 1, 2, 3
    const patients = [accounts[1], accounts[2], accounts[3]];
    // Doctors: Accounts 4, 5
    const doctors = [accounts[4], accounts[5]];
    // Companies: Accounts 6, 7
    const companies = [accounts[6], accounts[7]];

    console.log("--- STARTING FULL SEED ---");

    // --- 1. REGISTER PATIENTS & MINT RECORDS ---
    const recordData = [
        { name: "Blood Test Report", hospital: "City General", date: "2025-12-01" },
        { name: "MRI Scan - Knee", hospital: "Ortho Clinic", date: "2026-01-10" },
        { name: "Vaccination Cert", hospital: "Community Health", date: "2024-05-20" },
        { name: "X-Ray Chest", hospital: "City General", date: "2025-11-15" },
        { name: "Lab Results - Full Panel", hospital: "Quest Diagnostics", date: "2026-01-05" }
    ];

    for (let i = 0; i < patients.length; i++) {
        const pAddr = patients[i];
        try {
            console.log(`Setting up Patient ${i+1}: ${pAddr}`);
            await patientContract.registerPatient(`patient${i+1}`, `Patient ${i+1}`, `active${i+1}@demo.com`, 30+i, "O+", { from: pAddr });
            
            // Add 3-5 records per patient
            for (let j = 0; j < 3 + i; j++) {
                const rec = recordData[j % recordData.length];
                const ipfsHash = `QmFakeHash${i}${j}XXXYYYZZZ`; // Simulate hash
                await patientContract.addMedicalRecord(ipfsHash, rec.name, rec.date, rec.hospital, { from: pAddr });
                console.log(`  > Minted Record: ${rec.name}`);
            }
        } catch(e) { console.log(`  ! Skipped Patient ${i+1}: ${e.message}`); }
    }

    // --- 2. REGISTER DOCTORS & REQUEST ACCESS ---
    const doctorProfiles = [
        { name: "Dr. Strange", spec: "Neurology", hosp: "Sanctum Medical" },
        { name: "Dr. House", spec: "Diagnostics", hosp: "Princeton Plainsboro" }
    ];

    for (let i = 0; i < doctors.length; i++) {
        const dAddr = doctors[i];
        try {
            console.log(`Setting up Doctor ${i+1}: ${dAddr}`);
            await doctorContract.registerDoctor(doctorProfiles[i].name, doctorProfiles[i].spec, doctorProfiles[i].hosp, { from: dAddr });

            // Request access to first patient's first record
            // Need patient ID first? Logic might require address.
            // Doctor contract requests by (patientAddress, ipfsHash...)
            const targetPatient = patients[0];
            const fakeHash = "QmFakeHash00XXXYYYZZZ"; // Predictable hash from above
            
            await doctorContract.requestAccess(targetPatient, fakeHash, "Blood Test Report", 300, "Routine Checkup", { from: dAddr });
            console.log(`  > Requested Access to Patient 1`);

        } catch(e) { console.log(`  ! Skipped Doctor ${i+1}: ${e.message}`); }
    }

    // --- 3. REGISTER COMPANIES & CREATE OFFERS ---
    const companyProfiles = [
        { name: "Pfizer Research", budget: "5" },
        { name: "HealthAI Corp", budget: "3" }
    ];

    const offers = [
        { title: "Buying X-Ray Datasets", desc: "Looking for chest X-rays for AI training.", price: "0.05" },
        { title: "Diabetes Research Study", desc: "Need blood reports for glucose analysis.", price: "0.1" }
    ];

    for (let i = 0; i < companies.length; i++) {
        const cAddr = companies[i];
        try {
            console.log(`Setting up Company ${i+1}: ${cAddr}`);
            
            // Register
            const fees = web3.utils.toWei("0.1", "ether"); // Registration Fee
            await marketplaceContract.registerCompany("Com", companyProfiles[i].name, { from: cAddr, value: fees });

            // Create Offer
            const o = offers[i];
            const priceWei = web3.utils.toWei(o.price, "ether");
            const budgetWei = web3.utils.toWei(companyProfiles[i].budget, "ether");
            
            await marketplaceContract.createOffer(o.title, o.desc, priceWei, { from: cAddr, value: budgetWei });
            console.log(`  > Created Offer: ${o.title}`);

        } catch(e) { console.log(`  ! Skipped Company ${i+1}: ${e.message}`); }
    }

    // --- 4. SIMULATE TRANSACTIONS (Optional) ---
    // Simulate Patient 1 selling data to Company 1
    try {
        console.log("Simulating Sale: Patient 1 -> Company 1");
        // Get Offer ID 1
        // Get Hash
        const saleHash = "QmFakeHash00XXXYYYZZZ";
        // Marketplace offer IDs start at 1?
        await marketplaceContract.sellData(1, saleHash, { from: patients[0] });
        console.log("  > Sale Complete!");
    } catch(e) { console.log("  ! Sale failed (maybe already sold): " + e.message); }

    console.log("--- SEED COMPLETE ---");
    console.log("Use these accounts for Demo:");
    console.log(`Patient 1: ${patients[0]}`);
    console.log(`Doctor 1: ${doctors[0]}`);
    console.log(`Company 1: ${companies[0]}`);
    
    callback();
    
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
