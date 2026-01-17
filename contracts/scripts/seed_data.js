const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");

module.exports = async function(callback) {
  try {
    const patientContract = await Patient.deployed();
    const doctorContract = await Doctor.deployed();

    const [deployer, doctorAccount, patientAccount] = await web3.eth.getAccounts();
    
    // Use the specific address requested by user if possible, otherwise use available accounts
    // User asked for 0xFF... for both? That's impossible for separate roles if logic prevents it.
    // "use the public addres 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0 for both patient and doctor"
    // Smart contracts usually map msg.sender. If I use the same address for both, 
    // Patient contract: walletToPatientId[addr] = 1
    // Doctor contract: doctorIds[addr] = 1
    // It MIGHT work if they are independent contracts and don't cross-check 'is this address also a doctor?'.
    // Let's try to simulate this setup using the current provider's account 0 if it matches, 
    // or just use the first available account since I can't force the private key here without configuration.
    // Wait, I am running a script. I can't easily switch 'msg.sender' to an arbitrary address without its private key unless I unlock it or use ganache-cli --unlock.
    // The user provided a specific address. If that address is the ONE currently active in their browser (MetaMask), 
    // then I should ideally try to set up state for THAT address.
    // However, I can only execute transactions from accounts Ganache controls.
    // If the user's address is NOT in Ganache's list, I cannot transact As them.
    // I will use `accounts[0]` (deployer) and `accounts[1]` as valid substitutes for the demo script.
    // BUT the user specifically asked for that address.
    // "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0" is likely the first address of the deterministic mnemonic "myth like ...".
    // I will check if accounts[0] matches.
    
    const targetAddress = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0";
    console.log(`Target Address from user: ${targetAddress}`);
    
    // Check if we can unlock/impersonate or if it's already available
    const availableAccounts = await web3.eth.getAccounts();
    const foundAccount = availableAccounts.find(a => a.toLowerCase() === targetAddress.toLowerCase());
    
    let actor = foundAccount || availableAccounts[0];
    console.log(`Using actor account: ${actor}`);

    // 1. Register Patient (if not exists)
    // We updated registerPatient to take (username, name, email, age, bloodGroup)
    console.log("Registering Patient...");
    try {
        await patientContract.registerPatient("testuser", "Test Patient", "test@example.com", 30, "O+", { from: actor });
        console.log("Patient registered.");
    } catch(e) {
        console.log("Patient registration skipped (likely already registered): " + e.message);
    }
    
    // 2. Register Doctor (if not exists)
    // Doctor registration: registerDoctor(string _name, string _specialization, string _hospital)
    console.log("Registering Doctor...");
    try {
        await doctorContract.registerDoctor("Dr. Strange", "Neurology", "New York Hospital", { from: actor });
        console.log("Doctor registered.");
    } catch(e) {
        console.log("Doctor registration skipped: " + e.message);
    }
    
    // 3. Add Medical Record for Patient
    // addMedicalRecord(hash, fileName)
    // 3. Add Medical Record for Patient
    console.log("Adding Medical Record...");
    
    // Default Fallback
    let fileHash = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG";
    const fileName = "seed_record.txt";

    try {
        console.log("Attempting to upload to local server...");
        
        const fileContent = "This is a secure medical record uploaded via the seed script.";
        
        // Dynamic imports/definitions to handle Truffle environment quirks
        let BlobClass = typeof Blob !== 'undefined' ? Blob : require('buffer').Blob;
        let FormDataClass = typeof FormData !== 'undefined' ? FormData : null;
        
        if (!BlobClass || !FormDataClass) {
             throw new Error("Blob or FormData not available in this environment. Skipping upload.");
        }

        const fileBlob = new BlobClass([fileContent], { type: 'text/plain' });
        const formData = new FormDataClass();
        formData.append("file", fileBlob, fileName);
        formData.append("userAddress", actor);
        
        // Check for fetch
        if (typeof fetch === 'undefined') {
             throw new Error("fetch is not available. Skipping upload.");
        }

        const response = await fetch("http://localhost:5000/files", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (data.ipfsHash) {
            fileHash = data.ipfsHash;
            console.log(`File Uploaded Successfully. IPFS Hash: ${fileHash}`);
        }

    } catch (uploadError) {
        console.warn("Server upload verification failed (using fallback hash):");
        console.warn(uploadError.message);
    }

    console.log(`Adding Medical Record to Blockchain: ${fileHash}, ${fileName}`);
    await patientContract.addMedicalRecord(fileHash, fileName, "2026-01-17", "Seed Hospital", { from: actor });
    
    // 4. Doctor Adds Patient to their list
    // Doctor contract: addPatient(patientId)
    // First get patient ID
    const patId = await patientContract.walletToPatientId(actor);
    console.log(`Patient ID is: ${patId}`);
    
    // In this scenario, Doctor is SAME address as Patient.
    // doctorContract.addPatient(patId, { from: actor })
    try {
        await doctorContract.addPatient(patId, { from: actor });
        console.log("Doctor added patient (self) to list.");
    } catch(e) {
        console.log("Add patient skipped: " + e.message);
    }

    // 5. Grant Access
    // In normal flow: Doctor requests access -> Patient grants.
    // Or Patient grants directly? 
    // Patient.sol doesn't handle access control logic for the Doctor contract explicitly. 
    // Usually Doctor contract RequestAccess emits event, then Patient contract (or UI) calls `doctorContract.grantAccess`.
    // Wait, access control is likely stored on Doctor contract? 
    // Let's check Doctor.sol.
    // function grantAccess(uint256 _accessId) public
    // AND requestAccess(address _patient, string _ipfsHash, string _fileName)
    
    console.log("Requesting Access...");
    try {
        await doctorContract.requestAccess(actor, fileHash, fileName, 300, "Initial Test Access", { from: actor });
        console.log("Access Requested by Doctor.");
    } catch(e) {
        console.log("Request skipped: " + e.message);
    }
    
    // 6. Grant Access (as Patient)
    console.log("Granting Access...");
    try {
        // Patient calls grantAccess(doctorAddress, ipfsHash, duration)
        await doctorContract.grantAccess(actor, fileHash, 300, { from: actor });
        console.log("Access Granted by Patient.");
    } catch(e) {
         console.log("Grant Access skipped: " + e.message);
    }
    
    console.log("Seed Script Completed.");
    callback();
    
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
