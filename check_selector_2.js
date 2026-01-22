const ethers = require('ethers');

const sig = "submitInsuranceProof(uint256,uint256[2],uint256[2][2],uint256[2],uint256[5])";

function getSelector(sig) {
    return ethers.id(sig).substring(0, 10);
}

console.log(`Selector: ${getSelector(sig)}`);
