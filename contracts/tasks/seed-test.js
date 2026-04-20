task("seed-test", "Test registration with Hardhat")
    .setAction(async (taskArgs, hre) => {
        const [deployer, user1, user2] = await hre.ethers.getSigners();
        
        console.log("=== Testing with Hardhat ===\n");
        
        // Deploy AccessControl
        const AccessControl = await hre.ethers.getContractFactory("MediSecureAccessControl");
        const ac = await AccessControl.connect(deployer).deploy();
        await ac.waitForDeployment();
        console.log("AccessControl:", await ac.getAddress());
        
        // Deploy Mock Forwarder
        const Forwarder = await hre.ethers.getContractFactory("SanjeevniMockForwarder");
        const forwarder = await Forwarder.connect(deployer).deploy();
        await forwarder.waitForDeployment();
        
        // Deploy ConsentSBT
        const ConsentSBT = await hre.ethers.getContractFactory("ConsentSBT");
        const sbt = await ConsentSBT.connect(deployer).deploy(deployer.address);
        await sbt.waitForDeployment();
        
        // Deploy Patient
        const Patient = await hre.ethers.getContractFactory("Patient");
        const patient = await Patient.connect(deployer).deploy(await forwarder.getAddress());
        await patient.waitForDeployment();
        console.log("Patient:", await patient.getAddress());
        
        // Initialize
        await patient.initialize(await ac.getAddress(), await sbt.getAddress());
        await sbt.transferOwnership(await patient.getAddress());
        
        // Grant Patient admin role
        await ac.grantRole(await ac.ADMIN_ROLE(), await patient.getAddress());
        
        // Test registration
        console.log("\nTesting patient registration...");
        try {
            await patient.connect(user1).registerPatient("patient1", "Patient One", "patient1@test.com", 30, "O+");
            console.log("SUCCESS!");
        } catch(e) {
            console.log("FAILED:", e.message);
        }
    });