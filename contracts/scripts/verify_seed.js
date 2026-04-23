const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");

module.exports = async function(callback) {
  try {
    console.log("\n=== VERIFYING SEEDED DATA ===\n");

    const accounts = await web3.eth.getAccounts();
    
    const patientContract = await Patient.deployed();
    const doctorContract = await Doctor.deployed();
    const hospitalContract = await Hospital.deployed();

    // Check patients
    console.log("Patients:");
    const p1Exists = await patientContract.isRegistered(accounts[1]);
    const p2Exists = await patientContract.isRegistered(accounts[2]);
    console.log(`  Patient 1 (${accounts[1].slice(0,10)}...): ${p1Exists ? 'Registered' : 'Not registered'}`);
    console.log(`  Patient 2 (${accounts[2].slice(0,10)}...): ${p2Exists ? 'Registered' : 'Not registered'}`);

    // Check doctors
    console.log("\nDoctors:");
    const d1Exists = await doctorContract.doctorExists(accounts[4]);
    const d2Exists = await doctorContract.doctorExists(accounts[5]);
    console.log(`  Doctor 1 (${accounts[4].slice(0,10)}...): ${d1Exists ? 'Registered' : 'Not registered'}`);
    console.log(`  Doctor 2 (${accounts[5].slice(0,10)}...): ${d2Exists ? 'Registered' : 'Not registered'}`);

    // Check hospitals
    console.log("\nHospitals:");
    const h1Id = await hospitalContract.walletToHospitalId(accounts[0]);
    const h2Id = await hospitalContract.walletToHospitalId(accounts[9]);
    console.log(`  Hospital 1 (${accounts[0].slice(0,10)}...): ${h1Id.toString() !== '0' ? 'Registered (ID: ' + h1Id + ')' : 'Not registered'}`);
    console.log(`  Hospital 2 (${accounts[9].slice(0,10)}...): ${h2Id.toString() !== '0' ? 'Registered (ID: ' + h2Id + ')' : 'Not registered'}`);

    console.log("\n=== VERIFICATION COMPLETE ===\n");
    callback();
  } catch (error) {
    console.log("\n!!! ERROR !!!");
    console.log(error.message);
    callback(error);
  }
};