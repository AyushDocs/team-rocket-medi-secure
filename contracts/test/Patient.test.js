const Patient = artifacts.require("Patient");

contract("Patient", (accounts) => {
  let patientInstance;
  const [deployer, user1, user2] = accounts;

  before(async () => {
    patientInstance = await Patient.new();
  });

  it("should deploy the contract correctly", async () => {
    assert(patientInstance.address !== "", "Contract address should not be empty");
  });

  it("should register a new patient", async () => {
    const name = "John Doe";
    const email = "john@example.com";
    const age = 30;
    const bloodGroup = "O+";

    await patientInstance.registerPatient(name, email, age, bloodGroup, { from: user1 });

    const exists = await patientInstance.userExists(user1);
    assert.equal(exists, true, "Patient should exist after registration");

    // Check mapping indirectly via a getter if possible, or reliance on public getter
    const patientDetails = await patientInstance.getPatientDetails(1);
    assert.equal(patientDetails.name, name, "Name should match");
    assert.equal(patientDetails.email, email, "Email should match");
    assert.equal(patientDetails.age, age, "Age should match");
    assert.equal(patientDetails.bloodGroup, bloodGroup, "Blood group should match");
  });

  it("should prevent duplicate registration", async () => {
    try {
      await patientInstance.registerPatient("Jane", "jane@example.com", 25, "A-", { from: user1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Patient already registered"), "Expected 'Patient already registered' error");
    }
  });

  it("should allow adding medical records", async () => {
    const ipfsHash = "QmTestHash123";
    await patientInstance.addMedicalRecord(ipfsHash, { from: user1 });

    const patientId = 1; // user1 is the first registered
    const records = await patientInstance.getMedicalRecords(patientId);
    
    assert.equal(records.length, 1, "Should have 1 record");
    assert.equal(records[0], ipfsHash, "IPFS hash should match");
  });

  it("should not allow non-registered users to add records", async () => {
    try {
      await patientInstance.addMedicalRecord("QmFailHash", { from: user2 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Patient not registered"), "Expected 'Patient not registered' error");
    }
  });
});
