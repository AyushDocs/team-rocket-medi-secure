const Hospital = artifacts.require("Hospital");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("Hospital", (accounts) => {
  let hospitalInstance;
  let ac;
  const [hospitalAdmin, doctor1, doctor2, doctor3, other] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    hospitalInstance = await Hospital.new(ac.address);
    // Grant hospital contract ADMIN role to allow it to grant roles to users on registration
    await ac.grantAdminRole(hospitalInstance.address);
  });

  describe("Hospital Registration", () => {
    it("should register a new hospital", async () => {
      await hospitalInstance.registerHospital(
        "City General Hospital",
        "admin@cityhospital.com",
        "New York",
        "REG-12345",
        { from: hospitalAdmin }
      );

      const hospitalId = await hospitalInstance.walletToHospitalId(hospitalAdmin);
      assert.equal(hospitalId.toString(), "1", "Hospital ID should be 1");
    });
  });

  describe("Doctor Management", () => {
    it("should add doctors to the hospital", async () => {
      await hospitalInstance.addDoctor(doctor1, { from: hospitalAdmin });
      await hospitalInstance.addDoctor(doctor2, { from: hospitalAdmin });

      const docs = await hospitalInstance.getHospitalDoctors({ from: hospitalAdmin });
      assert.equal(docs.length, 2, "Should have 2 doctors");
    });

    it("should remove a doctor then re-add", async () => {
      await hospitalInstance.removeDoctor(doctor1, { from: hospitalAdmin });
      let docs = await hospitalInstance.getHospitalDoctors({ from: hospitalAdmin });
      assert.equal(docs.length, 1, "Should have 1 doctor after removal");
      
      await hospitalInstance.addDoctor(doctor1, { from: hospitalAdmin });
      docs = await hospitalInstance.getHospitalDoctors({ from: hospitalAdmin });
      assert.equal(docs.length, 2, "Should have 2 doctors after re-adding");
    });
  });

  describe("Doctor Duty Management", () => {
    it("should allow doctor to punch in", async () => {
      // doctor1 and doctor2 are both currently added from previous block
      const tx = await hospitalInstance.punchIn(hospitalAdmin, { from: doctor1 });

      assert.equal(tx.logs[0].event, "LogPunchIn", "Event should be LogPunchIn");
      
      const isOnDuty = await hospitalInstance.isDoctorOnDuty(doctor1, hospitalAdmin);
      assert.equal(isOnDuty, true, "Doctor should be on duty");
    });

    it("should allow another doctor to punch in", async () => {
      await hospitalInstance.punchIn(hospitalAdmin, { from: doctor2 });

      const activeCount = await hospitalInstance.getActiveDoctorCount(hospitalAdmin);
      assert.equal(activeCount.toString(), "2", "Should have 2 active doctors");
    });

    it("should allow doctor to punch out", async () => {
      const tx = await hospitalInstance.punchOut(hospitalAdmin, { from: doctor1 });

      assert.equal(tx.logs[0].event, "LogPunchOut", "Event should be LogPunchOut");
      
      const isOnDuty = await hospitalInstance.isDoctorOnDuty(doctor1, hospitalAdmin);
      assert.equal(isOnDuty, false, "Doctor should not be on duty");
    });
  });

  describe("Edge Cases", () => {
    it("should handle hospital with no doctors", async () => {
      const newHospitalAccount = accounts[7];
      const inst = await Hospital.new();
      await inst.registerHospital("Private Clinics", "priv@clinics.com", "Remote", "P-001", { from: newHospitalAccount });
      
      const doctors = await inst.getHospitalDoctors({ from: newHospitalAccount });
      assert.equal(doctors.length, 0, "New hospital should have no doctors");
    });
  });
});