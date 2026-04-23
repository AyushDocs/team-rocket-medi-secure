const crypto = require('crypto');

function keccak256(str) {
    return '0x' + crypto.createHash('sha3-256').update(str).digest('hex');
}

console.log("AccessControl: restricted-to-role selector:", keccak256("AccessControl: restricted-to-role").slice(0, 10));
console.log("AccessControl: restricted-to-admin selector:", keccak256("AccessControl: restricted-to-admin").slice(0, 10));
console.log("MediSecure Protocol: paused selector:", keccak256("MediSecure Protocol: paused").slice(0, 10));
console.log("Already registered selector:", keccak256("Already registered").slice(0, 10));
console.log("Username taken selector:", keccak256("Username taken").slice(0, 10));

console.log("\nFrom error data: 0xe2517d3f...");
console.log("This is the selector for:", "AccessControl: restricted-to-role");