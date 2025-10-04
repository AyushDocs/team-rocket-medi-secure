// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Patient {
    mapping(address => uint256) public walletToPatientId;

    function userExists(address walletAddress) public view returns (bool) {
        return walletToPatientId[walletAddress] != 0;
    }

    struct PatientDetails {
        uint256 patientId;
        string name;
        string email;
        uint8 age;
        string bloodGroup;
        string[] medicalRecords;
    }

    mapping(uint256 => PatientDetails) public patients;
    uint256 private patientIdCounter;

    function registerPatient(string memory _name, string memory _email, uint8 _age, string memory _bloodGroup) public {
        require(walletToPatientId[msg.sender] == 0, "Patient already registered");
        patientIdCounter++;
        walletToPatientId[msg.sender] = patientIdCounter;
        patients[patientIdCounter] = PatientDetails({
            patientId: patientIdCounter,
            name: _name,
            email: _email,
            age: _age,
            bloodGroup: _bloodGroup,
            medicalRecords: new string[](0)
        });
    }

    function addMedicalRecord(string memory _ipfsUrl) public {
        uint256 patientId = walletToPatientId[msg.sender];
        require(patientId != 0, "Patient not registered");

        patients[patientId].medicalRecords.push(_ipfsUrl);

    }

    function getPatientDetails(uint256 _patientId) public view returns (PatientDetails memory) {
        require(_patientId > 0 && _patientId <= patientIdCounter, "Invalid patient ID");
        return patients[_patientId];
    }

    function getMedicalRecords(uint256 _patientId) public view returns (string[] memory) {
        require(_patientId > 0 && _patientId <= patientIdCounter, "Invalid patient ID");
        return patients[_patientId].medicalRecords;
    }


}
