const HandoffManager = artifacts.require("HandoffManager");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("HandoffManager", (accounts) => {
  let handoffInstance;
  let ac;
  const [owner, nurse1, nurse2, patient1, patient2] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    handoffInstance = await HandoffManager.new(ac.address);
  });

  describe("Handoff Initialization", () => {
    it("should initialize a handoff", async () => {
      const tx = await handoffInstance.initiateHandoff(patient1, "QmClinicalReport123", { from: nurse1 });
      
      assert.equal(tx.logs.length, 1, "Should emit 1 event");
      assert.equal(tx.logs[0].event, "HandoffInitiated", "Event should be HandoffInitiated");
      
      const handoff = await handoffInstance.getHandoff(1);
      assert.equal(handoff.patient, patient1, "Patient should match");
      assert.equal(handoff.offGoingNurse, nurse1, "Off-going nurse should match");
      assert.equal(handoff.reportIpfsHash, "QmClinicalReport123", "IPFS hash should match");
      assert.equal(handoff.status, "PENDING", "Status should be PENDING");
      assert.equal(handoff.isComplete, false, "Should not be complete");
    });

    it("should track handoff count", async () => {
      await handoffInstance.initiateHandoff(patient2, "QmReport456", { from: nurse1 });
      
      const count = await handoffInstance.handoffCount();
      assert.equal(count.toString(), "2", "Handoff count should be 2");
    });
  });

  describe("Handoff Finalization", () => {
    it("should finalize handoff by relief nurse", async () => {
      const tx = await handoffInstance.finalizeHandoff(1, { from: nurse2 });
      
      assert.equal(tx.logs[0].event, "HandoffFinalized", "Event should be HandoffFinalized");
      
      const handoff = await handoffInstance.getHandoff(1);
      assert.equal(handoff.onComingNurse, nurse2, "On-coming nurse should match");
      assert.equal(handoff.isComplete, true, "Should be complete");
      assert.equal(handoff.status, "COMPLETED", "Status should be COMPLETED");
      assert(handoff.endTime > 0, "End time should be set");
    });

    it("should not allow off-going nurse to finalize", async () => {
      await handoffInstance.initiateHandoff(patient1, "QmReport789", { from: nurse2 });
      
      try {
        await handoffInstance.finalizeHandoff(3, { from: nurse2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Relief nurse cannot be the same"), "Expected error about same nurse");
      }
    });

    it("should not allow double finalization", async () => {
      try {
        await handoffInstance.finalizeHandoff(1, { from: nurse1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Handoff already finalized"), "Expected 'Handoff already finalized' error");
      }
    });
  });

  describe("Patient Handoff History", () => {
    it("should get patient handoff history", async () => {
      // nurse1 does handoff for patient1 twice
      await handoffInstance.initiateHandoff(patient1, "QmReport101", { from: nurse1 });
      await handoffInstance.finalizeHandoff(4, { from: nurse2 });
      
      await handoffInstance.initiateHandoff(patient1, "QmReport102", { from: nurse1 });
      await handoffInstance.finalizeHandoff(5, { from: nurse2 });

      const history = await handoffInstance.getPatientHandoffHistory(patient1);
      assert.equal(history.length, 4, "Patient should have 4 handoffs");
    });

    it("should return empty array for patient with no handoffs", async () => {
      const history = await handoffInstance.getPatientHandoffHistory(accounts[9]);
      assert.equal(history.length, 0, "Should have no handoffs");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple concurrent pending handoffs", async () => {
      await handoffInstance.initiateHandoff(patient1, "QmReportA", { from: nurse1 });
      await handoffInstance.initiateHandoff(patient2, "QmReportB", { from: nurse1 });

      const h1 = await handoffInstance.getHandoff(6);
      const h2 = await handoffInstance.getHandoff(7);
      
      assert.equal(h1.status, "PENDING", "First handoff should be pending");
      assert.equal(h2.status, "PENDING", "Second handoff should be pending");
    });

    it("should allow different nurses to handle different handoffs", async () => {
      const handoffId = await handoffInstance.initiateHandoff(patient1, "QmReportC", { from: nurse1 });
      
      // Nurse2 finalizes
      await handoffInstance.finalizeHandoff(8, { from: nurse2 });
      
      // Create new with nurse2 as off-going, nurse1 as relief
      await handoffInstance.initiateHandoff(patient2, "QmReportD", { from: nurse2 });
      await handoffInstance.finalizeHandoff(9, { from: nurse1 });

      const h2 = await handoffInstance.getHandoff(9);
      assert.equal(h2.onComingNurse, nurse1, "Nurse1 should be relief");
    });
  });
});