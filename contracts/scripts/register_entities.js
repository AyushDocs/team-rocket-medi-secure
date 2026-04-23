const Patient = artifacts.require("Patient");
const Doctor = artifacts.require("Doctor");
const Hospital = artifacts.require("Hospital");

module.exports = async function(callback) {
  try {
    console.log("\n=== REGISTERING ENTITIES ===\n");

    const accounts = await web3.eth.getAccounts();
    const patient1 = accounts[1];
    const patient2 = accounts[2];
    const doctor1 = accounts[4];
    const doctor2 = accounts[5];
    const hospital1 = accounts[0];
    const hospital2 = accounts[9];

    // Register Patient 1
    console.log("Registering Patient 1...");
    await web3.eth.sendTransaction({
      from: patient1,
      to: (await Patient.deployed()).address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "registerPatient", type: "function", inputs: [
          { name: "_username", type: "string" },
          { name: "_name", type: "string" },
          { name: "_email", type: "string" },
          { name: "_age", type: "uint256" },
          { name: "_bloodGroup", type: "string" }
        ]},
        ["patient1", "Patient One", "patient1@test.com", 30, "O+"]
      )
    });
    console.log("  > Patient 1 registered");

    // Register Patient 2
    console.log("Registering Patient 2...");
    await web3.eth.sendTransaction({
      from: patient2,
      to: (await Patient.deployed()).address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "registerPatient", type: "function", inputs: [
          { name: "_username", type: "string" },
          { name: "_name", type: "string" },
          { name: "_email", type: "string" },
          { name: "_age", type: "uint256" },
          { name: "_bloodGroup", type: "string" }
        ]},
        ["patient2", "Patient Two", "patient2@test.com", 25, "A+"]
      )
    });
    console.log("  > Patient 2 registered");

    // Register Doctor 1
    console.log("\nRegistering Doctor 1...");
    await web3.eth.sendTransaction({
      from: doctor1,
      to: (await Doctor.deployed()).address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "registerDoctor", type: "function", inputs: [
          { name: "_name", type: "string" },
          { name: "_specialization", type: "string" },
          { name: "_hospital", type: "string" }
        ]},
        ["Dr. Strange", "Neurology", "Sanctum Medical"]
      )
    });
    console.log("  > Doctor 1 registered");

    // Register Doctor 2
    console.log("Registering Doctor 2...");
    await web3.eth.sendTransaction({
      from: doctor2,
      to: (await Doctor.deployed()).address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "registerDoctor", type: "function", inputs: [
          { name: "_name", type: "string" },
          { name: "_specialization", type: "string" },
          { name: "_hospital", type: "string" }
        ]},
        ["Dr. House", "Diagnostics", "Princeton Plainsboro"]
      )
    });
    console.log("  > Doctor 2 registered");

    // Register Hospital 2
    console.log("\nRegistering Hospital 2...");
    await web3.eth.sendTransaction({
      from: hospital2,
      to: (await Hospital.deployed()).address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "registerHospital", type: "function", inputs: [
          { name: "_name", type: "string" },
          { name: "_contactEmail", type: "string" },
          { name: "_location", type: "string" },
          { name: "_registrationNumber", type: "string" }
        ]},
        ["Community Health", "contact@community.com", "LA", "REG456"]
      )
    });
    console.log("  > Hospital 2 registered");

    console.log("\n=== ALL ENTITIES REGISTERED ===\n");
    callback();
  } catch (error) {
    console.log("\n!!! ERROR !!!");
    console.log(error.message);
    callback(error);
  }
};