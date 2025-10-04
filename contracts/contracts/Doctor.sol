// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Doctor {
    struct DoctorDetails {
        uint256 doctorId;
        string name;
        string specialization;
        string email;
        uint256[] patientIds; // NEW: List of patients linked to this doctor
    }

    struct DocumentAccess {
        address patient;
        string ipfsHash;
        bool hasAccess;
    }

    mapping(address => uint256) public walletToDoctorId;
    mapping(uint256 => DoctorDetails) public doctors;
    mapping(uint256 => DocumentAccess[]) public doctorAccessList;

    uint256 private doctorIdCounter;

    // --- EVENTS ---
    event AccessRequested(address indexed patient, address indexed doctor, string ipfsHash);
    event PatientAdded(uint256 indexed doctorId, uint256 indexed patientId, address indexed doctor);

    // --- DOCTOR REGISTRATION ---
    function registerDoctor(
        string memory _name,
        string memory _specialization,
        string memory _email
    ) public {
        require(walletToDoctorId[msg.sender] == 0, "Doctor already registered");

        doctorIdCounter++;
        walletToDoctorId[msg.sender] = doctorIdCounter;

        doctors[doctorIdCounter] = DoctorDetails({
            doctorId: doctorIdCounter,
            name: _name,
            specialization: _specialization,
            email: _email,
            patientIds: new uint256[](0) // Initialize empty patient list
        });
    }

    // --- ADD PATIENT TO DOCTOR ---
    function addPatient(uint256 _patientId) public {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        // Optional: ensure no duplicate patient
        uint256[] storage patients = doctors[doctorId].patientIds;
        for (uint256 i = 0; i < patients.length; i++) {
            if (patients[i] == _patientId) {
                revert("Patient already added");
            }
        }

        doctors[doctorId].patientIds.push(_patientId);

        emit PatientAdded(doctorId, _patientId, msg.sender);
    }

    // --- GET DOCTOR'S PATIENT LIST ---
    function getDoctorPatients() public view returns (uint256[] memory) {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");
        return doctors[doctorId].patientIds;
    }

    // --- DOCUMENT ACCESS LOGIC ---
    function hasAccessToDocument(address _patient, string memory _ipfsHash)
        public
        view
        returns (bool)
    {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] memory accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _patient &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash)) &&
                accessList[i].hasAccess
            ) {
                return true;
            }
        }
        return false;
    }

    function requestAccess(address _patient, string memory _ipfsHash) public {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        doctorAccessList[doctorId].push(
            DocumentAccess({patient: _patient, ipfsHash: _ipfsHash, hasAccess: false})
        );

        emit AccessRequested(_patient, msg.sender, _ipfsHash);
    }

    function grantAccess(address _doctor, string memory _ipfsHash) public {
        uint256 doctorId = walletToDoctorId[_doctor];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == msg.sender &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash))
            ) {
                accessList[i].hasAccess = true;
                return;
            }
        }
        revert("Access request not found");
    }

    // --- GETTERS ---
    function getPatients() public view returns (DoctorDetails[] memory) {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] memory accessList = doctorAccessList[doctorId];
        DoctorDetails[] memory patients = new DoctorDetails[](accessList.length);
        uint256 count = 0;

        for (uint256 i = 0; i < accessList.length; i++) {
            if (accessList[i].hasAccess) {
                patients[count] = doctors[doctorId];
                count++;
            }
        }

        return patients;
    }

    function doctorExists(address walletAddress) public view returns (bool) {
        return walletToDoctorId[walletAddress] != 0;
    }

    function getAllDoctors() public view returns (DoctorDetails[] memory) {
        uint256 total = doctorIdCounter;
        DoctorDetails[] memory list = new DoctorDetails[](total);

        for (uint256 i = 0; i < total; i++) {
            list[i] = doctors[i + 1];
        }

        return list;
    }
}
