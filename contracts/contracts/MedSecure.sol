// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract MedSecure {
    struct Patient {
        bytes32 latestCidHash; // stores keccak256 of CID
        address owner;
        uint256 recordCount;
    }

    struct AccessLog {
        address provider;
        uint256 timestamp;
        string action;
    }

    mapping(uint256 => Patient) private patients;
    mapping(uint256 => mapping(uint256 => bytes32)) private patientRecords; // patientId → recordIndex → cidHash
    mapping(uint256 => AccessLog[]) private auditLogs;

    uint256 public patientCounter;

    event PatientCreated(uint256 patientId, address owner, bytes32 cidHash);
    event RecordUpdated(uint256 patientId, uint256 recordIndex, bytes32 cidHash);

    // create new patient
    function createPatient(bytes32 cidHash) external returns (uint256) {
        patientCounter++;
        Patient storage p = patients[patientCounter];
        p.latestCidHash = cidHash;
        p.owner = msg.sender;
        p.recordCount = 1;

        patientRecords[patientCounter][0] = cidHash;

        emit PatientCreated(patientCounter, msg.sender, cidHash);
        return patientCounter;
    }

    // update patient record
    function updateRecord(uint256 patientId, bytes32 cidHash) external {
        require(msg.sender == patients[patientId].owner, "Only owner can update");

        Patient storage p = patients[patientId];
        p.latestCidHash = cidHash;
        uint256 idx = p.recordCount;
        patientRecords[patientId][idx] = cidHash;
        p.recordCount++;

        auditLogs[patientId].push(AccessLog(msg.sender, block.timestamp, "write"));
        emit RecordUpdated(patientId, idx, cidHash);
    }

    // get the latest CID hash
    function getLatestRecord(uint256 patientId) external view returns (bytes32) {
        require(msg.sender == patients[patientId].owner, "Access denied");
        return patients[patientId].latestCidHash;
    }

    // get all CID hashes
    function getAllRecords(uint256 patientId) external view returns (bytes32[] memory) {
        require(msg.sender == patients[patientId].owner, "Access denied");
        Patient storage p = patients[patientId];
        bytes32[] memory records = new bytes32[](p.recordCount);
        for (uint256 i = 0; i < p.recordCount; i++) {
            records[i] = patientRecords[patientId][i];
        }
        return records;
    }
}
