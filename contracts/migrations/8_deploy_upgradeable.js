/**
 * Upgradeable Contracts Deployment
 * 
 * These contracts were deployed using Hardhat with @openzeppelin/hardhat-upgrades
 * because Truffle's upgrade plugin has compatibility issues with the current setup.
 * 
 * To upgrade these contracts in the future:
 * 1. Make changes to the Upgradeable contracts
 * 2. Run: npx hardhat run scripts/upgrade-contracts.js --network development
 */

module.exports = async function (deployer, network) {
    console.log('\n=== Upgradeable Contracts Info ===\n');
    console.log('The following contracts use UUPS proxy pattern and were deployed via Hardhat:');
    console.log('');
    console.log('PatientUpgradeable Proxy:   0x718e1497188318aDdf7e38b8318747006541F888');
    console.log('DoctorUpgradeable Proxy:   0x32e02F2934824ec085298E2B4e0e07935Ec6DaeC');
    console.log('InsuranceUpgradeable Proxy: 0x6082Ac385d4c63be87d5146b3c43E5E826A7341C');
    console.log('');
    console.log('To upgrade, use: npx hardhat run scripts/upgrade-contracts.js --network development');
    console.log('');
    
    // Save the deployment addresses for frontend
    const fs = require('fs');
    const deployment = {
        PatientUpgradeable: "0x718e1497188318aDdf7e38b8318747006541F888",
        DoctorUpgradeable: "0x32e02F2934824ec085298E2B4e0e07935Ec6DaeC",
        InsuranceUpgradeable: "0x6082Ac385d4c63be87d5146b3c43E5E826A7341C",
        network: "localhost (Ganache)",
        deployedVia: "Hardhat with @openzeppelin/hardhat-upgrades",
        timestamp: new Date().toISOString()
    };
    
    const dir = './deployments';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    fs.writeFileSync(
        './deployments/upgradeable-contracts.json',
        JSON.stringify(deployment, null, 2)
    );
    console.log('Deployment info saved to deployments/upgradeable-contracts.json');
};