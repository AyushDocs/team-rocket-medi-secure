const e = require("ethers");
const ethers = e.ethers;
const fs = require("fs");
const path = require("path");

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  
  const deployer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
  const user1 = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", provider);
  
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  
  const acArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../build/contracts/MediSecureAccessControl.json"), "utf8"));
  const acAddress = acArtifact.networks["1337"].address;
  const iface = new ethers.Interface(acArtifact.abi);
  
  console.log("\nAccessControl at:", acAddress);
  
  // The contract has grantAdminRole which is a convenience function
  // Use encodeFunctionData to call it
  console.log("\nGranting ADMIN role via grantAdminRole...");
  try {
    // grantAdminRole(address) = 0xa0cb6c3
    const adminData = iface.encodeFunctionData("grantAdminRole", [user1.address]);
    const tx = await deployer.sendTransaction({
      to: acAddress,
      data: adminData
    });
    await tx.wait();
    console.log("SUCCESS: Admin role granted to user1");
    
    // Now user1 can grant PATIENT role to themselves using grantRole(uint8,address)
    // Roles.PATIENT = 1 (based on enum order)
    // grantRole(uint8,address) selector should be different
    
    console.log("\nGranting PATIENT role to user1...");
    // grantRole(uint8,address) - PATIENT = 1
    const patientData = iface.encodeFunctionData("grantRole(uint8,address)", [1, user1.address]);
    const tx2 = await user1.sendTransaction({
      to: acAddress,
      data: patientData
    });
    await tx2.wait();
    console.log("SUCCESS: PATIENT role self-granted");
    
    // Now try to register patient
    console.log("\nRegistering patient...");
    const patientArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, "../build/contracts/Patient.json"), "utf8"));
    const patientIface = new ethers.Interface(patientArtifact.abi);
    const registerData = patientIface.encodeFunctionData("registerPatient", [
      "testuser", "Test User", "test@test.com", 25, "O+"
    ]);
    const tx3 = await user1.sendTransaction({
      to: patientArtifact.networks["1337"].address,
      data: registerData
    });
    await tx3.wait();
    console.log("SUCCESS: Patient registered!");
  } catch(err) {
    console.log("ERROR:", err.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });