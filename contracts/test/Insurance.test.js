const Insurance = artifacts.require("Insurance");
const MockInsuranceVerifier = artifacts.require("MockInsuranceVerifier");
const Hospital = artifacts.require("Hospital");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("Insurance", (accounts) => {
  let insuranceInstance;
  let verifierInstance;
  let hospitalInstance;
  let ac;
  const [deployer, provider1, provider2, patient1, patient2, hospital1, other] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    verifierInstance = await MockInsuranceVerifier.new();
    insuranceInstance = await Insurance.new(ac.address);
    hospitalInstance = await Hospital.new(ac.address);
    
    // Grant roles to contracts to allow self-registration role granting
    await ac.grantAdminRole(insuranceInstance.address);
    await ac.grantAdminRole(hospitalInstance.address);

    await insuranceInstance.setVerifier(verifierInstance.address);
    await insuranceInstance.setHospitalContract(hospitalInstance.address);
    // Register hospital to allow it to receive settlements
    await hospitalInstance.registerHospital("City General", "admin@citygen.com", "Main St", "REG123", { from: hospital1 });
    await insuranceInstance.registerInsuranceProvider("BlueCross", { from: provider1 });
    await insuranceInstance.registerInsuranceProvider("Aetna", { from: provider2 });
  });

  describe("Insurance Provider Registration", () => {
    it("should verify provider 1 registration", async () => {
      const isProvider = await insuranceInstance.isInsuranceProvider(provider1);
      assert.equal(isProvider, true, "Provider should be registered");
    });
  });

  describe("Policy Management", () => {
    it("should create a policy", async () => {
      await insuranceInstance.createPolicy(
        "Basic Health",
        "Basic health coverage",
        100, // basePremium
        18, // minAge
        140, // maxSystolic
        90, // maxDiastolic
        1, // requiredVaccine
        { from: provider2 }
      );

      const policy = await insuranceInstance.policies(1);
      assert.equal(policy.name, "Basic Health", "Policy name should match");
    });

    it("should create another policy", async () => {
      await insuranceInstance.createPolicy(
        "Premium Health",
        "Premium coverage",
        200,
        25,
        120,
        80,
        2,
        { from: provider2 }
      );

      const policies = await insuranceInstance.getProviderPolicies(provider2);
      assert.equal(policies.length, 2, "Should have 2 policies");
    });
  });

  describe("Insurance Quote Requests", () => {
    it("should request an insurance quote", async () => {
      await insuranceInstance.requestInsuranceQuote(2, { from: patient1 });

      const requests = await insuranceInstance.getPatientInsuranceRequests(patient1);
      assert.equal(requests.length, 1, "Should have 1 request");
      assert.equal(requests[0].policyId.toString(), "2", "Policy ID should match");
    });
  });

  describe("ZK Proof Verification", () => {
    it("should submit insurance proof and get discount", async () => {
      const requestId = 1;
      
      const a = [1, 1];
      const b = [[1, 1], [1, 1]];
      const c = [1, 1];
      const input = [1, 25, 120, 80, 1]; // isEligible=1

      await insuranceInstance.submitInsuranceProof(requestId, a, b, c, input, { from: patient1 });

      const request = await insuranceInstance.insuranceRequests(requestId);
      assert.equal(request.isVerified, true, "Request should be verified");
      // 200 base. 80% is 160.
      assert.equal(request.finalPremium.toString(), "160", "Final premium should be 160 (80% of 200)");
    });
  });

  describe("Policy Finalization", () => {
    it("should finalize policy by provider", async () => {
      const requestId = 1;
      await insuranceInstance.finalizePolicy(requestId, { from: provider2 });

      const request = await insuranceInstance.insuranceRequests(requestId);
      assert.equal(request.isFinalized, true, "Request should be finalized");
    });

    it("should not allow non-provider to finalize", async () => {
      try {
        await insuranceInstance.finalizePolicy(1, { from: other });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Not a registered provider") || error.message.includes("revert"), "Expected error message");
      }
    });
  });

  describe("Claims", () => {
    it("should submit a claim", async () => {
      // (requestId, hospitalAddress, procedureName, cost, evidenceHash)
      const evidenceHash = web3.utils.keccak256("QmClaimEvidence123");
      await insuranceInstance.submitClaim(1, hospital1, "MRI Scan", 500, evidenceHash, { from: patient1 });

      const claims = await insuranceInstance.getPatientClaims(patient1);
      assert.equal(claims.length, 1, "Should have 1 claim");
      assert.equal(claims[0].status, "PENDING", "Status should be PENDING");
      assert.equal(claims[0].hospitalAddress, hospital1, "Hospital address should match");
    });

    it("should process claim as approved and settle to hospital", async () => {
      const initialHospitalBalance = await hospitalInstance.pendingEarnings(hospital1);
      
      // Approved status requires msg.value >= cost (500)
      await insuranceInstance.processClaim(1, "APPROVED", { from: provider2, value: 500 });

      const claim = await insuranceInstance.claims(1);
      assert.equal(claim.status, "APPROVED", "Claim should be APPROVED");
      
      const finalHospitalBalance = await hospitalInstance.pendingEarnings(hospital1);
      assert.equal(
        finalHospitalBalance.toString(), 
        (BigInt(initialHospitalBalance) + BigInt(500)).toString(), 
        "Hospital pending earnings should increase by claim amount"
      );
    });
  });
});