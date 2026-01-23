// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Patient is ERC721URIStorage {
    uint256 private _nextTokenId;

    mapping(address => uint256) public walletToPatientId;
    mapping(string => uint256) public usernameToPatientId; // Username -> ID mapping

    function userExists(address walletAddress) public view returns (bool) {
        return walletToPatientId[walletAddress] != 0;
    }

    struct MedicalRecord {
        uint256 tokenId; // NFT ID
        string ipfsHash;
        string fileName;
        string recordDate;
        string hospital;
        bool isEmergencyViewable;
    }

    struct PatientDetails {
        uint256 patientId;
        string username;
        string name;
        address walletAddress;
        string email;
        uint8 age;
        string bloodGroup;
        MedicalRecord[] medicalRecords;
    }

    mapping(uint256 => PatientDetails) public patients;
    uint256 private patientIdCounter;

    struct Nominee {
        string name;
        address walletAddress;
        string relationship;
        string contactNumber;
    }

    mapping(uint256 => Nominee[]) public patientNominees;
    mapping(uint256 => bytes32) public emergencyAccessHashes;

    function setEmergencyAccessHash(bytes32 _hash) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");
        emergencyAccessHashes[patientId] = _hash;
    }

    function verifyEmergencyHash(uint256 _patientId, bytes32 _hash) public view returns (bool) {
        return emergencyAccessHashes[_patientId] == _hash;
    }

    constructor() ERC721("MediSecure Record", "MEDREC") {}

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

    function updatePatientDetails(
        string memory _name,
        string memory _email,
        uint8 _age,
        string memory _bloodGroup
    ) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");

        PatientDetails storage patient = patients[patientId];
        patient.name = _name;
        patient.email = _email;
        patient.age = _age;
        patient.bloodGroup = _bloodGroup;
    }

    function addNominee(
        string memory _name,
        address _walletAddress,
        string memory _relationship,
        string memory _contactNumber
    ) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");

        patientNominees[patientId].push(
            Nominee({
                name: _name,
                walletAddress: _walletAddress,
                relationship: _relationship,
                contactNumber: _contactNumber
            })
        );
    }

    function getNominees(
        uint256 _patientId
    ) public view returns (Nominee[] memory) {
        return patientNominees[_patientId];
    }

    function addMedicalRecord(
        string memory _ipfsHash,
        string memory _fileName,
        string memory _recordDate,
        string memory _hospital,
        bool _isEmergencyViewable
    ) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");

        // Mint NFT
        uint256 tokenId = _nextTokenId++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, _ipfsHash);

        patients[patientId].medicalRecords.push(
            MedicalRecord({
                tokenId: tokenId,
                ipfsHash: _ipfsHash,
                fileName: _fileName,
                recordDate: _recordDate,
                hospital: _hospital,
                isEmergencyViewable: _isEmergencyViewable
            })
        );
    }

    function toggleEmergencyVisibility(uint256 _recordIndex) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");
        require(_recordIndex < patients[patientId].medicalRecords.length, "Invalid record index");

        patients[patientId].medicalRecords[_recordIndex].isEmergencyViewable = !patients[patientId].medicalRecords[_recordIndex].isEmergencyViewable;
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
