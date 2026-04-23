const MediSecureAccessControl = artifacts.require("MediSecureAccessControl");
const SanjeevniToken = artifacts.require("SanjeevniToken");
const SanjeevniMockForwarder = artifacts.require("SanjeevniMockForwarder");

module.exports = async function (deployer) {
    // 1. Deploy Access Control
    await deployer.deploy(MediSecureAccessControl);
    const ac = await MediSecureAccessControl.deployed();
    console.log(`MediSecureAccessControl deployed at: ${ac.address}`);

    // 2. Deploy Sanjeevni Token
    await deployer.deploy(SanjeevniToken);
    const token = await SanjeevniToken.deployed();
    console.log(`SanjeevniToken deployed at: ${token.address}`);

    // 3. Deploy Mock Forwarder (for development/testing)
    await deployer.deploy(SanjeevniMockForwarder);
    const forwarder = await SanjeevniMockForwarder.deployed();
    console.log(`SanjeevniMockForwarder deployed at: ${forwarder.address}`);
    
    // 4. Grant admin role to deployer (if not already done by constructor)
    // The constructor already grants admin to msg.sender, so this is just for clarity
    // No action needed - deployer already has admin role
    
    // 5. Save Artifacts for Frontend and Server
    const fs = require('fs');
    const path = require('path');
    const networkId = await web3.eth.net.getId();
    const frontendPath = path.join(__dirname, '..', '..', 'frontend', 'contracts');
    const serverPath = path.join(__dirname, '..', '..', 'server', 'contracts');
    
    // Ensure directories exist
    [frontendPath, serverPath].forEach(dir => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    
    const contracts = [
        { artifact: MediSecureAccessControl, instance: ac, name: 'MediSecureAccessControl' },
        { artifact: SanjeevniToken, instance: token, name: 'SanjeevniToken' },
        { artifact: SanjeevniMockForwarder, instance: forwarder, name: 'SanjeevniMockForwarder' }
    ];
    
    for (const { artifact, instance, name } of contracts) {
        const data = artifact.toJSON();
        if (!data.networks) data.networks = {};
        data.networks[networkId] = {
            address: instance.address,
            transactionHash: instance.transactionHash
        };
        fs.writeFileSync(path.join(frontendPath, `${name}.json`), JSON.stringify(data, null, 2));
        fs.writeFileSync(path.join(serverPath, `${name}.json`), JSON.stringify(data, null, 2));
        console.log(`${name} synced to frontend and server.`);
    }
};
