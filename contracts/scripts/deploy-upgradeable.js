require("@openzeppelin/hardhat-upgrades");
const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Upgradeable Contracts...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    
    // Deploy Patient
    console.log("\n1. Deploying PatientUpgradeable...");
    const Patient = await ethers.getContractFactory("PatientUpgradeable");
    const patientProxy = await upgrades.deployProxy(Patient, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await patientProxy.waitForDeployment();
    const patientAddress = await patientProxy.getAddress();
    console.log(`   Patient Proxy: ${patientAddress}`);
    
    // Deploy Doctor
    console.log("\n2. Deploying DoctorUpgradeable...");
    const Doctor = await ethers.getContractFactory("DoctorUpgradeable");
    const doctorProxy = await upgrades.deployProxy(Doctor, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await doctorProxy.waitForDeployment();
    const doctorAddress = await doctorProxy.getAddress();
    console.log(`   Doctor Proxy: ${doctorAddress}`);
    
    // Deploy Insurance
    console.log("\n3. Deploying InsuranceUpgradeable...");
    const Insurance = await ethers.getContractFactory("InsuranceUpgradeable");
    const insuranceProxy = await upgrades.deployProxy(Insurance, [], {
        initializer: "initialize",
        kind: "uups"
    });
    await insuranceProxy.waitForDeployment();
    const insuranceAddress = await insuranceProxy.getAddress();
    console.log(`   Insurance Proxy: ${insuranceAddress}`);
    
    // Get implementation addresses
    const patientImpl = await upgrades.erc1967.getImplementationAddress(patientAddress);
    const doctorImpl = await upgrades.erc1967.getImplementationAddress(doctorAddress);
    const insuranceImpl = await upgrades.erc1967.getImplementationAddress(insuranceAddress);
    
    console.log("\n=== Deployment Summary ===");
    console.log(`Patient Proxy:     ${patientAddress}`);
    console.log(`Patient Impl:      ${patientImpl}`);
    console.log(`Doctor Proxy:      ${doctorAddress}`);
    console.log(`Doctor Impl:       ${doctorImpl}`);
    console.log(`Insurance Proxy:   ${insuranceAddress}`);
    console.log(`Insurance Impl:    ${insuranceImpl}`);
    
    // Save addresses
    const fs = require("fs");
    const addresses = {
        Patient: patientAddress,
        Doctor: doctorAddress,
        Insurance: insuranceAddress,
        PatientImplementation: patientImpl,
        DoctorImplementation: doctorImpl,
        InsuranceImplementation: insuranceImpl,
        network: "localhost",
        timestamp: new Date().toISOString()
    };
    
    if (!fs.existsSync("./deployments")) {
        fs.mkdirSync("./deployments");
    }
    fs.writeFileSync(
        "./deployments/upgradeable-contracts.json",
        JSON.stringify(addresses, null, 2)
    );
    console.log("\nAddresses saved to deployments/upgradeable-contracts.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });