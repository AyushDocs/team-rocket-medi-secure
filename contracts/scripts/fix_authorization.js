const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const Doctor = artifacts.require("Doctor");

module.exports = async function(callback) {
  try {
    const ac = await MediSecureAccessControl.deployed();
    const doctor = await Doctor.deployed();
    
    console.log("AC Address:", ac.address);
    console.log("Doctor Address:", doctor.address);
    
    const isManager = await ac.authorizedManagers(doctor.address);
    console.log("Is Doctor authorized manager before:", isManager);
    
    if (!isManager) {
      console.log("Authorizing Doctor as manager...");
      await ac.setAuthorizedManager(doctor.address, true);
      console.log("Doctor authorized successfully.");
    } else {
      console.log("Doctor already authorized.");
    }
    
    callback();
  } catch (e) {
    console.error(e);
    callback(e);
  }
};
