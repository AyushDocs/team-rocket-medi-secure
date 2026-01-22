const ethers = require('ethers');

const sig1 = "verifyProof(uint[2],uint[2][2],uint[2],uint[5])";
const sig2 = "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[5])";

function getSelector(sig) {
    return ethers.id(sig).substring(0, 10);
}

console.log(`Selector 1: ${getSelector(sig1)}`);
console.log(`Selector 2: ${getSelector(sig2)}`);
