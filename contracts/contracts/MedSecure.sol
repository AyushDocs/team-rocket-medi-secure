// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract MedSecure {
    struct Patient {
        bytes32[] recordHashes; // Track all IPFS CIDs (as bytes32)
        address owner;
        mapping(address => bool) allowedProviders;
    }

    mapping(uint256 => Patient) private patients;
    uint256 public patientCounter;

    event PatientCreated(uint256 patientId, bytes32 initialHash, address owner);
    event AccessGranted(uint256 patientId, address provider);
    event AccessRevoked(uint256 patientId, address provider);
    event RecordUpdated(uint256 patientId, bytes32 newHash);

    modifier onlyOwner(uint256 patientId) {
        require(msg.sender == patients[patientId].owner, "Only owner");
        _;
    }

    function createPatient(bytes32 initialHash) external returns (uint256) {
        patientCounter++;
        Patient storage p = patients[patientCounter];
        p.owner = msg.sender;
        p.recordHashes.push(initialHash);

        emit PatientCreated(patientCounter, initialHash, msg.sender);
        return patientCounter;
    }

    function grantAccess(uint256 patientId, address provider) external onlyOwner(patientId) {
        patients[patientId].allowedProviders[provider] = true;
        emit AccessGranted(patientId, provider);
    }

    function revokeAccess(uint256 patientId, address provider) external onlyOwner(patientId) {
        patients[patientId].allowedProviders[provider] = false;
        emit AccessRevoked(patientId, provider);
    }

    function updateRecord(uint256 patientId, bytes32 newHash) external onlyOwner(patientId) {
        patients[patientId].recordHashes.push(newHash);
        emit RecordUpdated(patientId, newHash);
    }

    function getLatestRecord(uint256 patientId) external view returns (bytes32) {
        require(
            msg.sender == patients[patientId].owner || patients[patientId].allowedProviders[msg.sender],
            "Access denied"
        );
        uint256 n = patients[patientId].recordHashes.length;
        return patients[patientId].recordHashes[n - 1];
    }

    function getAllRecords(uint256 patientId) external view returns (bytes32[] memory) {
        require(
            msg.sender == patients[patientId].owner || patients[patientId].allowedProviders[msg.sender],
            "Access denied"
        );
        return patients[patientId].recordHashes;
    }
}
