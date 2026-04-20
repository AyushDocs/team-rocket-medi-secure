const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");

module.exports = async function(callback) {
  try {
    console.log("\n=== GRANTING ROLES VIA DIRECT CALLS ===\n");

    const ac = await MediSecureAccessControl.deployed();
    const accounts = await web3.eth.getAccounts();
    const deployer = accounts[0];

    const patient1 = accounts[1];
    const patient2 = accounts[2];
    const patient3 = accounts[3];
    const doctor1 = accounts[4];
    const doctor2 = accounts[5];
    const company1 = accounts[6];
    const company2 = accounts[7];
    const insurance1 = accounts[8];
    const hospital2 = accounts[9];

    console.log("Using direct contract calls with encoded data...");

    // Use web3 to send transaction with encoded function data
    // grantPatientRole(address) selector: 0x3b3a1813
    
    console.log("\nGranting roles to patients...");
    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantPatientRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [patient1]
      )
    });
    console.log(`  > Patient 1: ${patient1.slice(0,10)}...`);

    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantPatientRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [patient2]
      )
    });
    console.log(`  > Patient 2: ${patient2.slice(0,10)}...`);

    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantPatientRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [patient3]
      )
    });
    console.log(`  > Patient 3: ${patient3.slice(0,10)}...`);

    console.log("\nGranting roles to doctors...");
    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantDoctorRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [doctor1]
      )
    });
    console.log(`  > Doctor 1: ${doctor1.slice(0,10)}...`);

    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantDoctorRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [doctor2]
      )
    });
    console.log(`  > Doctor 2: ${doctor2.slice(0,10)}...`);

    console.log("\nGranting roles to companies...");
    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantCompanyRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [company1]
      )
    });
    console.log(`  > Company 1: ${company1.slice(0,10)}...`);

    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantCompanyRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [company2]
      )
    });
    console.log(`  > Company 2: ${company2.slice(0,10)}...`);

    console.log("\nGranting role to insurance...");
    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantInsuranceRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [insurance1]
      )
    });
    console.log(`  > Insurance: ${insurance1.slice(0,10)}...`);

    console.log("\nGranting role to hospital 2...");
    await web3.eth.sendTransaction({
      from: deployer,
      to: ac.address,
      data: web3.eth.abi.encodeFunctionCall(
        { name: "grantHospitalRole", type: "function", inputs: [{ name: "account", type: "address" }] },
        [hospital2]
      )
    });
    console.log(`  > Hospital 2: ${hospital2.slice(0,10)}...`);

    console.log("\n=== ALL ROLES GRANTED ===\n");
    
    callback();
  } catch (error) {
    console.log("\n!!! ERROR !!!");
    console.log(error.message);
    callback(error);
  }
};