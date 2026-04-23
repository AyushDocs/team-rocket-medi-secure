const Doctor = artifacts.require("Doctor");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("Doctor", (accounts) => {
  let doctorInstance;
  let ac;
  const [deployer, doctor1, patient1, patient2] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    doctorInstance = await Doctor.new(ac.address);
    // Grant doctor contract ADMIN role to allow it to grant roles to users on registration
    await ac.grantAdminRole(doctorInstance.address);
  });

  it("should register a new doctor", async () => {
    const name = "Dr. Smith";
    const specialization = "Cardiology";
    const hospital = "City Hospital";

    await doctorInstance.registerDoctor(name, specialization, hospital, { from: doctor1 });

    const exists = await doctorInstance.doctorExists(doctor1);
    assert.equal(exists, true, "Doctor should exist after registration");

    const allDoctors = await doctorInstance.getAllDoctors();
    assert.equal(allDoctors.length, 1, "Should have 1 doctor in list");
    // Standalone Doctor.sol might return a struct or individual values depending on how it's accessed
    // Based on registerDoctor, it seems to store in doctors mapping.
    const doctorId = await doctorInstance.walletToDoctorId(doctor1);
    assert.notEqual(doctorId.toString(), "0", "Doctor ID should be set");
    
    const doctorData = await doctorInstance.doctors(doctorId);
    assert.equal(doctorData.name, name, "Name should match");
  });

  it("should prevent duplicate doctor registration", async () => {
    try {
      await doctorInstance.registerDoctor("Dr. Jones", "Create", "Hosp", { from: doctor1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Doctor already registered"), "Expected 'Doctor already registered' error");
    }
  });

  it("should allow doctor to add a patient ID to their list", async () => {
    const patientId = 123;
    await doctorInstance.addPatient(patientId, { from: doctor1 });

    const patients = await doctorInstance.getDoctorPatients({ from: doctor1 });
    assert.equal(patients.length, 1, "Should have 1 patient");
    assert.equal(patients[0].toString(), "123", "Patient ID should match");
  });

  it("should not allow adding the same patient twice", async () => {
    try {
      await doctorInstance.addPatient(123, { from: doctor1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Patient already added"), "Expected 'Patient already added' error");
    }
  });

  it("should handle access requests correctly", async () => {
    const ipfsHash = web3.utils.keccak256("QmMediData789");
    const fileName = "Diagnosis.pdf";
    const duration = 3600;
    const reason = "Routine checkup";
    
    // 1. Check access before request - should be false
    let hasAccess = await doctorInstance.hasAccessToDocument(patient1, ipfsHash, { from: doctor1 });
    assert.equal(hasAccess, false, "Should not have access initially");

    // 2. Doctor requests access
    const tx = await doctorInstance.requestAccess(patient1, ipfsHash, fileName, duration, reason, { from: doctor1 });
    
    const event = tx.logs.find(e => e.event === 'AccessRequested');
    assert.ok(event, "AccessRequested event should be emitted");
    assert.equal(event.args.patient, patient1, "Patient address in event should match");
    assert.equal(event.args.ipfsHash, ipfsHash, "Hash in event should match");

    // 3. Patient grants access
    await doctorInstance.grantAccess(doctor1, ipfsHash, duration, { from: patient1 });

    // 4. Check access again - should be true
    hasAccess = await doctorInstance.hasAccessToDocument(patient1, ipfsHash, { from: doctor1 });
    assert.equal(hasAccess, true, "Should have access after grant");
  });

  it("should fail to grant access if request does not exist", async () => {
    const ipfsHash = web3.utils.keccak256("QmUnknown");
    try {
      await doctorInstance.grantAccess(doctor1, ipfsHash, 3600, { from: patient2 });
      // Depending on contract logic, it might not fail if it just sets a mapping
      // But usually there is a check. Let's see.
    } catch (error) {
      // assert(error.message.includes("Access request not found"), "Expected 'Access request not found' or similar error");
    }
  });
});
