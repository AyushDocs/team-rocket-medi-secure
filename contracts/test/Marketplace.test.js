const Marketplace = artifacts.require("Marketplace");
const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

contract("Marketplace", (accounts) => {
  let marketplaceInstance;
  let ac;
  const [company1, company2, patient1, patient2, patient3, other] = accounts;

  before(async () => {
    ac = await MediSecureAccessControl.new();
    marketplaceInstance = await Marketplace.new(ac.address);
  });

  describe("Company Registration", () => {
    it("should register a new company", async () => {
      await marketplaceInstance.registerCompany("Research Corp", "contact@research.com", { from: company1 });
      
      const isCompany = await marketplaceInstance.isCompany(company1);
      assert.equal(isCompany, true, "Company should be registered");
    });
  });

  describe("Offer Management", () => {
    it("should create a data offer with sufficient funds", async () => {
      await marketplaceInstance.createOffer(
        "Heart Disease Research",
        "Looking for anonymous heart data",
        web3.utils.toWei("0.01", "ether"),
        { from: company1, value: web3.utils.toWei("1", "ether") }
      );

      const offer = await marketplaceInstance.offers(1);
      assert.equal(offer.budget.toString(), web3.utils.toWei("1", "ether"), "Budget should match");
    });

    it("should allow company to fund existing offer", async () => {
      await marketplaceInstance.fundOffer(1, { from: company1, value: web3.utils.toWei("0.5", "ether") });

      const offer = await marketplaceInstance.offers(1);
      assert.equal(offer.budget.toString(), web3.utils.toWei("1.5", "ether"), "Budget should increase");
    });
  });

  describe("Data Selling and Claims", () => {
    it("should allow patient to sell data and accumulate earnings", async () => {
      const initialPending = await marketplaceInstance.pendingEarnings(patient3);
      const ipfsHash = web3.utils.keccak256("QmPatientDataXYZ");
      await marketplaceInstance.sellData(1, ipfsHash, { from: patient3 });

      const finalPending = await marketplaceInstance.pendingEarnings(patient3);
      const price = web3.utils.toWei("0.01", "ether");
      
      assert.equal(finalPending.toString(), (BigInt(initialPending) + BigInt(price)).toString(), "Pending earnings should increase");
    });

    it("should allow patient to claim earnings", async () => {
      const balanceBefore = await web3.eth.getBalance(patient3);
      const pendingBefore = await marketplaceInstance.pendingEarnings(patient3);
      
      const tx = await marketplaceInstance.claimEarnings({ from: patient3 });
      const gasUsed = BigInt(tx.receipt.gasUsed);
      const gasPrice = BigInt(tx.receipt.effectiveGasPrice || 0); // Handle EIP-1559 or legacy
      const gasCost = gasUsed * gasPrice;
      
      const balanceAfter = await web3.eth.getBalance(patient3);
      const pendingAfter = await marketplaceInstance.pendingEarnings(patient3);
      
      assert.equal(pendingAfter.toString(), "0", "Pending earnings should be cleared");
      
      const expectedBalance = BigInt(balanceBefore) + BigInt(pendingBefore) - gasCost;
      assert.equal(balanceAfter.toString(), expectedBalance.toString(), "Balance should increase by earnings minus gas");
    });

    it("should deactivate offer when budget exhausted", async () => {
      // price is 0.01. budget is 1.49. need 149 more sales.
      // we already did 1. so 148 more.
      // to avoid infinite time, let's just test with a smaller initial budget for another offer
      await marketplaceInstance.createOffer(
        "Small Study",
        "Small budget",
        web3.utils.toWei("0.01", "ether"),
        { from: company1, value: web3.utils.toWei("0.02", "ether") }
      );
      // id = 2. budget = 0.02.
      await marketplaceInstance.sellData(2, web3.utils.keccak256("Data1"), { from: patient1 });
      await marketplaceInstance.sellData(2, web3.utils.keccak256("Data2"), { from: patient2 });
      
      try {
        await marketplaceInstance.sellData(2, web3.utils.keccak256("Data3"), { from: patient3 });
        assert.fail("Should have thrown exhaustion error");
      } catch (error) {
        assert(error.message.includes("Offer budget exhausted") || error.message.includes("revert"), "Expected exhausted error");
      }
    });
  });

  describe("Getters", () => {
    it("should get company purchases", async () => {
      const purchases = await marketplaceInstance.getCompanyPurchases({ from: company1 });
      // 1 from offer 1, 2 from offer 2.
      assert.equal(purchases.length, 3, "Should have 3 purchases");
    });
  });
});