const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Marketplace = artifacts.require("Marketplace");
const Hospital = artifacts.require("Hospital");
const PatientDetails = artifacts.require("PatientDetails");

module.exports = async function(callback) {
  try {
    const patientContract = await Patient.deployed();
    const doctorContract = await Doctor.deployed();
    const marketplaceContract = await Marketplace.deployed();
    const hospitalContract = await Hospital.deployed();
    const patientDetailsContract = await PatientDetails.deployed();

    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    const patients = [accounts[1], accounts[2], accounts[3]];
    const doctors = [accounts[4], accounts[5]];
    const companies = [accounts[6], accounts[7]];
    const hospitalAdmins = [accounts[0], accounts[8]];

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
            try {
                await patientContract.registerPatient(`patient${i+1}`, `Patient ${i+1}`, `active${i+1}@demo.com`, 30+i, "O+", { from: pAddr });
                console.log(`  > Registered Patient ${i+1}`);
            } catch(e) { console.log(`  > Patient ${i+1} already registered, skipping registration.`); }
            
            // Add 3-5 records per patient
            for (let j = 0; j < 3 + i; j++) {
                const rec = recordData[j % recordData.length];
                const ipfsHash = `QmFakeHash${i}${j}XXXYYYZZZ`; // Simulate hash
                try {
                    await patientContract.addMedicalRecord(ipfsHash, rec.name, rec.date, rec.hospital, { from: pAddr });
                    console.log(`  > Minted Record: ${rec.name}`);
                } catch(e) { /* ignore duplicate records if any */ }
            }

            // Add Nominee
            try {
                await patientContract.addNominee(`Nominee ${i+1}`, accounts[9], "Family", `555-010${i}`, { from: pAddr });
                console.log(`  > Added Nominee: Nominee ${i+1}`);
            } catch(e) { /* ignore */ }

            // Set Vitals in the new PatientDetails contract
            await patientDetailsContract.setVitals(
                `${110 + i}/${70 + i}`, // BP
                `${65 + i} kg`,         // Weight
                `${170 + i} cm`,        // Height
                `${70 + i} bpm`,        // Heart Rate
                "98.6 F",               // Temp
                { from: pAddr }
            );
            console.log(`  > Set Vitals for Patient ${i+1}`);

            // Test Profile Update for first patient
            if (i === 0) {
                 await patientContract.updatePatientDetails(`Patient One Updated`, `updated1@demo.com`, 31, "O+", { from: pAddr });
                 console.log(`  > Updated Profile for Patient 1`);
            }
        } catch(e) { console.log(`  ! Error in Patient ${i+1} setup: ${e.message}`); }
    }

    // --- 2. REGISTER DOCTORS ---
    const doctorProfiles = [
        { name: "Dr. Strange", spec: "Neurology", hosp: "Sanctum Medical" },
        { name: "Dr. House", spec: "Diagnostics", hosp: "Princeton Plainsboro" }
    ];

    for (let i = 0; i < doctors.length; i++) {
        const dAddr = doctors[i];
        try {
            console.log(`Setting up Doctor ${i+1}: ${dAddr}`);
            await doctorContract.registerDoctor(doctorProfiles[i].name, doctorProfiles[i].spec, doctorProfiles[i].hosp, { from: dAddr });
            
            // Note: Request Access logic moved later potentially? No, fine here.
            const targetPatient = patients[0];
            const fakeHash = "QmFakeHash00XXXYYYZZZ"; 
            await doctorContract.requestAccess(targetPatient, fakeHash, "Blood Test Report", 300, "Routine Checkup", { from: dAddr });
            console.log(`  > Requested Access to Patient 1`);

        } catch(e) { console.log(`  ! Skipped Doctor ${i+1}: ${e.message}`); }
    }

    // --- 3. REGISTER HOSPITALS & LINK DOCTORS ---
    console.log("--- REGISTERING HOSPITALS ---");
    const hospitalData = [
        { name: "City General", location: "NYC", reg: "REG123" },
        { name: "Community Health", location: "LA", reg: "REG456" }
    ];

    for(let i=0; i<hospitalAdmins.length; i++) {
        try {
            // Check if already registered (primitive check via error)
             console.log(`Setting up Hospital ${i+1}: ${hospitalData[i].name} (${hospitalAdmins[i]})`);
            await hospitalContract.registerHospital(
                hospitalData[i].name, 
                `contact@${hospitalData[i].name.replace(/\s/g, '').toLowerCase()}.com`, 
                hospitalData[i].location, 
                hospitalData[i].reg, 
                { from: hospitalAdmins[i] }
            );
            console.log(`  > Registered Hospital`);
            
            // Add Doctor
            if (i < doctors.length) {
                 await hospitalContract.addDoctor(doctors[i], { from: hospitalAdmins[i] });
                 console.log(`  > Added Doctor ${i+1} to ${hospitalData[i].name}`);
            }
        } catch(e) { console.log(`  ! Skipped Hospital ${i+1}: ${e.message}`); }
    }

    // --- 4. SIMULATE PUNCH IN ---
    try {
        console.log(`Doctor 1 Punching In at City General...`);
        // Doctor 1 is doctors[0], City General is hospitalAdmins[0]
        await hospitalContract.punchIn(hospitalAdmins[0], { from: doctors[0] });
        console.log(`  > Punched In!`);
        
        console.log(`Doctor 2 Punching In at Community Health...`);
        await hospitalContract.punchIn(hospitalAdmins[1], { from: doctors[1] });
        console.log(`  > Punched In!`);
    } catch(e) { console.log(`  ! Punch In Failed: ${e.message}`); }


    // --- 5. REGISTER COMPANIES & CREATE OFFERS ---
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
            await marketplaceContract.registerCompany(companyProfiles[i].name, `info@${companyProfiles[i].name.replace(/\s/g, '').toLowerCase()}.com`, { from: cAddr });

            // Create Offer
            const o = offers[i];
            const priceWei = web3.utils.toWei(o.price, "ether");
            const budgetWei = web3.utils.toWei(companyProfiles[i].budget, "ether");
            
            await marketplaceContract.createOffer(o.title, o.desc, priceWei, { from: cAddr, value: budgetWei });
            console.log(`  > Created Offer: ${o.title}`);

        } catch(e) { console.log(`  ! Skipped Company ${i+1}: ${e.message}`); }
    }

    // --- 6. SIMULATE TRANSACTIONS ---
    try {
        console.log("Simulating Sale: Patient 1 -> Company 1");
        const saleHash = "QmFakeHash00XXXYYYZZZ";
        await marketplaceContract.sellData(1, saleHash, { from: patients[0] });
        console.log("  > Sale Complete!");
    } catch(e) { console.log("  ! Sale failed (maybe already sold): " + e.message); }

    console.log("--- SEED COMPLETE ---");
    console.log("Use these accounts for Demo:");
    console.log(`Patient 1: ${patients[0]}`);
    console.log(`Doctor 1: ${doctors[0]}`);
    console.log(`Hospital 1 (City Gen): ${hospitalAdmins[0]}`);
    console.log(`Hospital 2 (Community): ${hospitalAdmins[1]}`);
    console.log(`Company 1: ${companies[0]}`);
    
    callback();
    
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
