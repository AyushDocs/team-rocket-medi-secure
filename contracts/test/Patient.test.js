const Patient = artifacts.require("Patient");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("Patient", (accounts) => {
  let patientInstance;
  let ac;
  const [deployer, user1, user2] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    patientInstance = await Patient.new(ac.address);
    // Grant patient contract ADMIN role to allow it to grant roles to users on registration
    await ac.grantAdminRole(patientInstance.address);
  });

  it("should deploy the contract correctly", async () => {
    assert(patientInstance.address !== "", "Contract address should not be empty");
  });

  it("should register a new patient", async () => {
    const username = "johndoe";
    const name = "John Doe";
    const email = "john@example.com";
    const age = 30;
    const bloodGroup = "O+";

    await patientInstance.registerPatient(username, name, email, age, bloodGroup, { from: user1 });

    const exists = await patientInstance.userExists(user1);
    assert.equal(exists, true, "Patient should exist after registration");

    // In Patient.sol, getPatientDetails returns an object with patientName field
    const details = await patientInstance.getPatientDetails(1);
    assert.equal(details.name, name, "Name should match");
    assert.equal(details.email, email, "Email should match");
  });

  it("should prevent duplicate registration", async () => {
    try {
      await patientInstance.registerPatient("janedoe", "Jane", "jane@example.com", 25, "A-", { from: user1 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Patient already registered"), "Expected 'Patient already registered' error");
    }
  });

  it("should allow adding medical records", async () => {
    const ipfsHash = web3.utils.keccak256("QmTestHash123");
    const fileName = "Record1.pdf";
    const recordDate = "2023-10-27";
    const hospital = "City Hospital";
    const emergencyViewable = true;
    
    await patientInstance.addMedicalRecord(ipfsHash, fileName, recordDate, hospital, emergencyViewable, { from: user1 });

    const patientId = 1;
    const records = await patientInstance.getMedicalRecords(patientId);
    
    assert.equal(records.length, 1, "Should have 1 record");
    // Standalone Patient.sol returns an array of MedicalRecord structs
    // Each struct in JS might be an object with named properties or an array
    const firstRecord = records[0];
    const hash = firstRecord.ipfsHash || firstRecord[1]; // fallback for different truffle versions
    assert.equal(hash, ipfsHash, "IPFS hash should match");
  });

  it("should not allow non-registered users to add records", async () => {
    try {
      const failHash = web3.utils.keccak256("QmFailHash");
      await patientInstance.addMedicalRecord(failHash, "File.pdf", "2023-10-27", "Hosp", false, { from: user2 });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Patient not registered"), "Expected 'Patient not registered' error");
    }
  });
});