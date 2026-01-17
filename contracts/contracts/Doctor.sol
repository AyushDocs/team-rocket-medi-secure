// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Doctor {
    struct DoctorDetails {
        uint256 doctorId;
        string name;
        string specialization;
        string email;
        uint256[] patientIds; // List of patients linked to this doctor
    }

    struct DocumentAccess {
        address patient;
        string ipfsHash;
        string fileName;
        bool hasAccess;
        uint256 grantTime;
        uint256 duration;
        string reason;
        bool isEmergency;
        bool isResolved; // NEW: Alert dismissed?
    }

    mapping(address => uint256) public walletToDoctorId;
    mapping(uint256 => DoctorDetails) public doctors;
    mapping(uint256 => DocumentAccess[]) public doctorAccessList;

    uint256 private doctorIdCounter;

    // --- EVENTS ---
    event AccessRequested(
        address indexed patient,
        address indexed doctor,
        string ipfsHash,
        string fileName,
        uint256 duration,
        string reason
    );
    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        string ipfsHash,
        uint256 grantTime,
        uint256 duration
    );
    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        string ipfsHash,
        uint256 revokeTime
    );
    event PatientAdded(
        uint256 indexed doctorId,
        uint256 indexed patientId,
        address indexed doctor
    );
    event EmergencyAccessGranted(
        address indexed doctor,
        address indexed patient,
        string ipfsHash,
        string reason,
        uint256 timestamp
    );
    event EmergencyResolved(
        address indexed patient,
        address indexed resolver,
        string ipfsHash,
        uint256 timestamp
    );

    function registerDoctor(
        string memory _name,
        string memory _specialization,
        string memory _hospital
    ) public {
        require(walletToDoctorId[msg.sender] == 0, "Doctor already registered");
        doctorIdCounter++;
        walletToDoctorId[msg.sender] = doctorIdCounter;

        DoctorDetails storage newDoctor = doctors[doctorIdCounter];
        newDoctor.doctorId = doctorIdCounter;
        newDoctor.name = _name;
        newDoctor.specialization = _specialization;
        newDoctor.email = _hospital;
    }

    function addPatient(uint256 _patientId) public {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        bool exists = false;
        for (uint i = 0; i < doctors[doctorId].patientIds.length; i++) {
            if (doctors[doctorId].patientIds[i] == _patientId) {
                exists = true;
                break;
            }
        }
        require(!exists, "Patient already added");

        doctors[doctorId].patientIds.push(_patientId);
        emit PatientAdded(doctorId, _patientId, msg.sender);
    }

    function getDoctorPatients() public view returns (uint256[] memory) {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");
        return doctors[doctorId].patientIds;
    }

    function hasAccessToDocument(
        address _patient,
        string memory _ipfsHash
    ) public view returns (bool) {
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
                // Check for expiration
                if (
                    block.timestamp >
                    accessList[i].grantTime + accessList[i].duration
                ) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    function requestAccess(
        address _patient,
        string memory _ipfsHash,
        string memory _fileName,
        uint256 _duration,
        string memory _reason
    ) public {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        doctorAccessList[doctorId].push(
            DocumentAccess({
                patient: _patient,
                ipfsHash: _ipfsHash,
                fileName: _fileName,
                hasAccess: false,
                grantTime: 0,
                duration: _duration,
                reason: _reason,
                isEmergency: false,
                isResolved: false
            })
        );

        emit AccessRequested(
            _patient,
            msg.sender,
            _ipfsHash,
            _fileName,
            _duration,
            _reason
        );
    }

    function emergencyBreakGlass(
        address _patient,
        string memory _ipfsHash,
        string memory _fileName,
        string memory _reason
    ) public {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        doctorAccessList[doctorId].push(
            DocumentAccess({
                patient: _patient,
                ipfsHash: _ipfsHash,
                fileName: _fileName,
                hasAccess: true, // Auto Grant
                grantTime: block.timestamp,
                duration: 24 hours, // Fixed duration for emergency
                reason: _reason,
                isEmergency: true,
                isResolved: false
            })
        );

        emit EmergencyAccessGranted(
            msg.sender,
            _patient,
            _ipfsHash,
            _reason,
            block.timestamp
        );
    }

    function grantAccess(
        address _doctor,
        string memory _ipfsHash,
        uint256 _duration
    ) public {
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
                accessList[i].grantTime = block.timestamp;
                accessList[i].duration = _duration;

                emit AccessGranted(
                    msg.sender,
                    _doctor,
                    _ipfsHash,
                    block.timestamp,
                    _duration
                );
                return;
            }
        }
        revert("Access request not found");
    }

    function resolveEmergency(address _doctor, string memory _ipfsHash) public {
        uint256 doctorId = walletToDoctorId[_doctor];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == msg.sender &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash)) &&
                accessList[i].isEmergency
            ) {
                accessList[i].isResolved = true;
                emit EmergencyResolved(
                    msg.sender,
                    msg.sender,
                    _ipfsHash,
                    block.timestamp
                );
                return;
            }
        }
        revert("Emergency record not found or already resolved");
    }

    function revokeAccess(address _doctor, string memory _ipfsHash) public {
        uint256 doctorId = walletToDoctorId[_doctor];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == msg.sender &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash))
            ) {
                accessList[i].hasAccess = false;
                if (accessList[i].isEmergency) {
                    accessList[i].isResolved = true;
                }
                emit AccessRevoked(
                    msg.sender,
                    _doctor,
                    _ipfsHash,
                    block.timestamp
                );
                return;
            }
        }
        revert("Access record not found");
    }

    // --- GETTERS ---
    function getAccessList() public view returns (DocumentAccess[] memory) {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");
        return doctorAccessList[doctorId];
    }

    function getPatients() public view returns (DoctorDetails[] memory) {
        uint256 doctorId = walletToDoctorId[msg.sender];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] memory accessList = doctorAccessList[doctorId];
        DoctorDetails[] memory patients = new DoctorDetails[](
            accessList.length
        );
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
