const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const PatientDetails = artifacts.require("PatientDetails");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("PatientDetails", (accounts) => {
  let patientDetailsInstance;
  let ac;
  const [owner, patient1, patient2, provider1, provider2] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    patientDetailsInstance = await deployProxy(PatientDetails, [ac.address], { initializer: 'initialize' });
    
    // Grant upgrader role to owner for testing upgrades
    await ac.grantUpgraderRole(owner);
  });

  describe("Initialization", () => {
    it("should initialize correctly", async () => {
      assert(patientDetailsInstance.address !== "", "Contract should have address");
    });
  });

  describe("Patient Vitals - Self Service", () => {
    it("should allow patient to set their own vitals", async () => {
      await patientDetailsInstance.setVitals(
        "120/80",
        "70",
        "175",
        "72",
        "98.6",
        { from: patient1 }
      );

      const vitals = await patientDetailsInstance.getVitals(patient1);
      assert.equal(vitals.bloodPressure, "120/80", "Blood pressure should match");
      assert.equal(vitals.weight, "70", "Weight should match");
      assert.equal(vitals.height, "175", "Height should match");
      assert.equal(vitals.heartRate, "72", "Heart rate should match");
      assert.equal(vitals.temperature, "98.6", "Temperature should match");
    });

    it("should update existing vitals", async () => {
      await patientDetailsInstance.setVitals(
        "125/85",
        "71",
        "175",
        "75",
        "98.4",
        { from: patient1 }
      );

      const vitals = await patientDetailsInstance.getVitals(patient1);
      assert.equal(vitals.bloodPressure, "125/85", "Blood pressure should be updated");
    });

    it("should set vitals for another patient", async () => {
      await patientDetailsInstance.setVitals(
        "118/78",
        "65",
        "168",
        "68",
        "98.2",
        { from: patient2 }
      );

      const vitals = await patientDetailsInstance.getVitals(patient2);
      assert.equal(vitals.bloodPressure, "118/78", "Blood pressure should match");
    });

    it("should emit VitalsUpdated event", async () => {
      const tx = await patientDetailsInstance.setVitals(
        "130/85",
        "75",
        "180",
        "80",
        "99.0",
        { from: patient1 }
      );

      assert.equal(tx.logs[0].event, "VitalsUpdated", "Event should be VitalsUpdated");
      assert.equal(tx.logs[0].args.patient, patient1, "Patient address should match");
    });
  });

  describe("Provider Vitals Update", () => {
    it("should allow owner to set vitals for patient", async () => {
      await patientDetailsInstance.setVitalsForPatient(
        patient1,
        "122/82",
        "74",
        "98.8",
        { from: owner }
      );

      const vitals = await patientDetailsInstance.getVitals(patient1);
      assert.equal(vitals.bloodPressure, "122/82", "Blood pressure should be updated by provider");
    });

    it("should emit VitalsUpdatedByProvider event", async () => {
      const tx = await patientDetailsInstance.setVitalsForPatient(
        patient1,
        "128/84",
        "76",
        "99.1",
        { from: owner }
      );

      assert.equal(tx.logs[0].event, "VitalsUpdatedByProvider", "Event should be VitalsUpdatedByProvider");
      assert.equal(tx.logs[0].args.provider, owner, "Provider should match");
    });

    it("should not allow non-owner to set vitals for patient", async () => {
      try {
        await patientDetailsInstance.setVitalsForPatient(
          patient1,
          "120/80",
          "72",
          "98.6",
          { from: provider1 }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("revert"), "Expected revert from Ownable");
      }
    });
  });

  describe("Clinical Alerts", () => {
    it("should allow owner to trigger clinical alert", async () => {
      await patientDetailsInstance.triggerClinicalAlert(
        patient1,
        "Low blood pressure detected",
        "high",
        { from: owner }
      );

      const alerts = await patientDetailsInstance.getAlerts(patient1);
      assert.equal(alerts.length, 1, "Should have 1 alert");
      assert.equal(alerts[0].issue, "Low blood pressure detected", "Alert issue should match");
      assert.equal(alerts[0].severity, "high", "Severity should match");
      assert.equal(alerts[0].resolved, false, "Should not be resolved");
    });

    it("should emit ClinicalAlertTriggered event", async () => {
      const tx = await patientDetailsInstance.triggerClinicalAlert(
        patient2,
        "High heart rate",
        "medium",
        { from: owner }
      );

      assert.equal(tx.logs[0].event, "ClinicalAlertTriggered", "Event should be ClinicalAlertTriggered");
      assert.equal(tx.logs[0].args.severity, "medium", "Severity should match");
    });

    it("should not allow non-owner to trigger alert", async () => {
      try {
        await patientDetailsInstance.triggerClinicalAlert(
          patient1,
          "Fake alert",
          "low",
          { from: provider1 }
        );
        assert.fail("Should have thrown an error");
      } catch (error) {
         assert(error.message.includes("revert"), "Expected revert from Ownable");
      }
    });

    it("should allow multiple alerts for same patient", async () => {
      await patientDetailsInstance.triggerClinicalAlert(patient1, "Alert 1", "low", { from: owner });
      await patientDetailsInstance.triggerClinicalAlert(patient1, "Alert 2", "high", { from: owner });

      const alerts = await patientDetailsInstance.getAlerts(patient1);
      assert.equal(alerts.length, 3, "Should have 3 alerts (1 from previous test + 2 new)");
    });
  });

  describe("Alert History", () => {
    it("should get empty alerts for new patient", async () => {
      const alerts = await patientDetailsInstance.getAlerts(accounts[9]);
      assert.equal(alerts.length, 0, "Should have no alerts");
    });

    it("should preserve alert history order", async () => {
      const alerts = await patientDetailsInstance.getAlerts(patient1);
      assert(alerts[0].timestamp <= alerts[1].timestamp, "Alerts should be in chronological order");
    });
  });

  describe("Vitals Timestamp", () => {
    it("should update lastUpdated timestamp", async () => {
      const before = await patientDetailsInstance.getVitals(patient1);
      const beforeTime = parseInt(before.lastUpdated);

      // Advance time by 10 seconds instantly
      await new Promise((resolve, reject) => {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_increaseTime",
          params: [10],
          id: new Date().getTime()
        }, (err, res) => {
          if (err) return reject(err);
          // Mine a block to materialize the time change
          web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: new Date().getTime()
          }, (err2, res2) => {
            if (err2) return reject(err2);
            resolve(res2);
          });
        });
      });

      await patientDetailsInstance.setVitals(
        "130/90",
        "80",
        "180",
        "85",
        "100.0",
        { from: patient1 }
      );

      const after = await patientDetailsInstance.getVitals(patient1);
      const afterTime = parseInt(after.lastUpdated);

      assert(afterTime > beforeTime, "Timestamp should be updated");
    });
  });
});