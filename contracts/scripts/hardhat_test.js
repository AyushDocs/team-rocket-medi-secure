const hre = require("hardhat");

async function main() {
    const [deployer, user1, user2] = await hre.ethers.getSigners();
    
    console.log("=== Testing with Hardhat ===\n");
    
    // Get existing contracts (assuming they're already deployed)
    // For this test, let's redeploy fresh
    
    console.log("Deploying fresh contracts...");
    
    // 1. Deploy AccessControl
    const AccessControl = await hre.ethers.getContractFactory("MediSecureAccessControl");
    const ac = await AccessControl.connect(deployer).deploy();
    await ac.waitForDeployment();
    console.log("AccessControl:", await ac.getAddress());
    
    // 2. Deploy Mock Forwarder
    const Forwarder = await hre.ethers.getContractFactory("SanjeevniMockForwarder");
    const forwarder = await Forwarder.connect(deployer).deploy();
    await forwarder.waitForDeployment();
    console.log("Forwarder:", await forwarder.getAddress());
    
    // 3. Deploy ConsentSBT
    const ConsentSBT = await hre.ethers.getContractFactory("ConsentSBT");
    const sbt = await ConsentSBT.connect(deployer).deploy(deployer.address);
    await sbt.waitForDeployment();
    console.log("ConsentSBT:", await sbt.getAddress());
    
    // 4. Deploy Patient
    const Patient = await hre.ethers.getContractFactory("Patient");
    const patient = await Patient.connect(deployer).deploy(await forwarder.getAddress());
    await patient.waitForDeployment();
    console.log("Patient:", await patient.getAddress());
    
    // 5. Initialize Patient
    const tx1 = await patient.initialize(await ac.getAddress(), await sbt.getAddress());
    await tx1.wait();
    console.log("Patient initialized");
    
    // Transfer SBT ownership
    const tx2 = await sbt.transferOwnership(await patient.getAddress());
    await tx2.wait();
    console.log("SBT ownership transferred");
    
    // Grant Patient admin role (should work since deployer is admin)
    const tx3 = await ac.grantRole(await ac.ADMIN_ROLE(), await patient.getAddress());
    await tx3.wait();
    console.log("Patient granted ADMIN role");
    
    // Test: Register a patient from user1
    console.log("\nTesting patient registration from user1...");
    try {
        const tx4 = await patient.connect(user1).registerPatient(
            "patient1", "Patient One", "patient1@test.com", 30, "O+"
        );
        await tx4.wait();
        console.log("SUCCESS! Patient registered.");
        
        // Verify
        const exists = await patient.isRegistered(user1.address);
        console.log("isRegistered:", exists);
    } catch(e) {
        console.log("FAILED:", e.message);
    }
    
    console.log("\n=== Test Complete ===");
}

main().catch(console.error);