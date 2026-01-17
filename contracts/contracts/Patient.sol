// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Patient {
    mapping(address => uint256) public walletToPatientId;
    mapping(string => uint256) public usernameToPatientId; // Username -> ID mapping

    function userExists(address walletAddress) public view returns (bool) {
        return walletToPatientId[walletAddress] != 0;
    }

    struct MedicalRecord {
        string ipfsHash;
        string fileName;
        string recordDate;
        string hospital;
    }

    struct PatientDetails {
        uint256 patientId;
        string username; // Added username
        string name;
        address walletAddress;
        string email;
        uint8 age;
        string bloodGroup;
        MedicalRecord[] medicalRecords;
    }

    mapping(uint256 => PatientDetails) public patients;
    uint256 private patientIdCounter;

    function registerPatient(
        string memory _username,
        string memory _name,
        string memory _email,
        uint8 _age,
        string memory _bloodGroup
    ) public {
        require(
            walletToPatientId[msg.sender] == 0,
            "Patient already registered"
        );
        require(usernameToPatientId[_username] == 0, "Username already taken");

        patientIdCounter++;
        walletToPatientId[msg.sender] = patientIdCounter;
        usernameToPatientId[_username] = patientIdCounter;

        PatientDetails storage newPatient = patients[patientIdCounter];
        newPatient.patientId = patientIdCounter;
        newPatient.username = _username;
        newPatient.name = _name;
        newPatient.walletAddress = msg.sender;
        newPatient.email = _email;
        newPatient.age = _age;
        newPatient.bloodGroup = _bloodGroup;
    }

    function addMedicalRecord(
        string memory _ipfsHash,
        string memory _fileName,
        string memory _recordDate,
        string memory _hospital
    ) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");

        patients[patientId].medicalRecords.push(
            MedicalRecord({
                ipfsHash: _ipfsHash,
                fileName: _fileName,
                recordDate: _recordDate,
                hospital: _hospital
            })
        );
    }

    function getPatientDetails(
        uint256 _patientId
    ) public view returns (PatientDetails memory) {
        require(
            _patientId > 0 && _patientId <= patientIdCounter,
            "Invalid patient ID"
        );
        return patients[_patientId];
    }

    // Helper to get ID from username (useful for frontend)
    function getPatientIdByUsername(
        string memory _username
    ) public view returns (uint256) {
        return usernameToPatientId[_username];
    }

    function getMedicalRecords(
        uint256 _patientId
    ) public view returns (MedicalRecord[] memory) {
        require(
            _patientId > 0 && _patientId <= patientIdCounter,
            "Invalid patient ID"
        );
        return patients[_patientId].medicalRecords;
    }
}
