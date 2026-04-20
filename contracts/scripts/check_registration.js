const Patient = artifacts.require("Patient");

module.exports = async function(callback) {
  try {
    const patientAddress = "0x0156006AB2dFb07Db490Bf876Fb50E1ce4Aa27c5";
    const patient = await Patient.deployed();
    const registered = await patient.isRegistered(patientAddress);
    const pId = await patient.walletToPatientId(patientAddress);
    
    console.log(`Checking address: ${patientAddress}`);
    console.log(`Is Registered: ${registered}`);
    console.log(`Patient ID: ${pId.toString()}`);
    
    callback();
  } catch (error) {
    console.error(error);
    callback(error);
  }
};
