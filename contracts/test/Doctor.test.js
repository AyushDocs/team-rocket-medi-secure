const Doctor = artifacts.require("Doctor");

contract("Doctor", (accounts) => {
  let doctorInstance;
  const [deployer, doctor1, patient1, patient2] = accounts;

  before(async () => {
    doctorInstance = await Doctor.new();
  });

  it("should register a new doctor", async () => {
    const name = "Dr. Smith";
    const specialization = "Cardiology";
    const email = "smith@hospital.com";

    await doctorInstance.registerDoctor(name, specialization, email, { from: doctor1 });

    const exists = await doctorInstance.doctorExists(doctor1);
    assert.equal(exists, true, "Doctor should exist after registration");

    const allDoctors = await doctorInstance.getAllDoctors();
    assert.equal(allDoctors.length, 1, "Should have 1 doctor in list");
    assert.equal(allDoctors[0].name, name, "Name should match");
  });

  it("should prevent duplicate doctor registration", async () => {
    try {
      await doctorInstance.registerDoctor("Dr. Jones", "Create", "jones@hospital.com", { from: doctor1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Doctor already registered"), "Expected 'Doctor already registered' error");
    }
  });

  it("should allow doctor to add a patient ID to their list", async () => {
    const patientId = 123;
    await doctorInstance.addPatient(patientId, { from: doctor1 });

    const patients = await doctorInstance.getDoctorPatients({ from: doctor1 });
    // Returns array of BigInt/BN usually, treat as string comparison or number
    assert.equal(patients.length, 1, "Should have 1 patient");
    assert.equal(patients[0].toString(), "123", "Patient ID should match");
  });

  it("should not allow adding the same patient twice", async () => {
    try {
      await doctorInstance.addPatient(123, { from: doctor1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      // The revert message in contract is "Patient already added"
      assert(error.message.includes("Patient already added"), "Expected 'Patient already added' error");
    }
  });

  it("should handle access requests correctly", async () => {
    const ipfsHash = "QmMediData789";
    
    // 1. Check access before request - should be false
    let hasAccess = await doctorInstance.hasAccessToDocument(patient1, ipfsHash, { from: doctor1 });
    assert.equal(hasAccess, false, "Should not have access initially");

    // 2. Doctor requests access
    const tx = await doctorInstance.requestAccess(patient1, ipfsHash, { from: doctor1 });
    // Check for AccessRequested event
    const event = tx.logs.find(e => e.event === 'AccessRequested');
    assert.ok(event, "AccessRequested event should be emitted");
    assert.equal(event.args.patient, patient1, "Patient address in event should match");
    assert.equal(event.args.ipfsHash, ipfsHash, "Hash in event should match");

    // 3. Patient grants access
    // Note: grantAccess takes (_doctor, _ipfsHash)
    await doctorInstance.grantAccess(doctor1, ipfsHash, { from: patient1 });

    // 4. Check access again - should be true
    hasAccess = await doctorInstance.hasAccessToDocument(patient1, ipfsHash, { from: doctor1 });
    assert.equal(hasAccess, true, "Should have access after grant");
  });

  it("should fail to grant access if request does not exist", async () => {
    const ipfsHash = "QmUnknown";
    try {
      // patient2 tries to grant access to doctor1, but doctor1 never requested it for patient2
      await doctorInstance.grantAccess(doctor1, ipfsHash, { from: patient2 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Access request not found"), "Expected 'Access request not found' or similar error");
    }
  });
});
