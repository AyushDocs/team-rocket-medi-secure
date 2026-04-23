// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/MediSecureAuth.sol";
import {Roles} from "./MediSecureAccessControl.sol";

/**
 * @title RBACDoctor
 * @dev Doctor contract with OpenZeppelin AccessControl for role-based permissions (Legacy Compatibility).
 */
contract RBACDoctor is MediSecureAuth {
    constructor(address _accessControl, address _forwarder) MediSecureAuth(_accessControl, _forwarder) {}
    
    struct DoctorDetails {
        uint256 doctorId;
        string name;
        string specialization;
        string email;
        uint256[] patientIds;
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
        bool isResolved;
    }

    mapping(address => uint256) public walletToDoctorId;
    mapping(uint256 => DoctorDetails) public doctors;
    mapping(uint256 => DocumentAccess[]) public doctorAccessList;

    uint256 private doctorIdCounter;

    // Events
    event AccessRequested(address indexed patient, address indexed doctor, string ipfsHash, string fileName, uint256 duration, string reason);
    event AccessGranted(address indexed patient, address indexed doctor, string ipfsHash, uint256 grantTime, uint256 duration);
    event AccessRevoked(address indexed patient, address indexed doctor, string ipfsHash, uint256 revokeTime);
    event PatientAdded(uint256 indexed doctorId, uint256 indexed patientId, address indexed doctor);
    event EmergencyAccessGranted(address indexed doctor, address indexed patient, string ipfsHash, string reason, uint256 timestamp);
    event EmergencyResolved(address indexed patient, address indexed resolver, string ipfsHash, uint256 timestamp);

    function registerDoctor(string memory _name, string memory _specialization, string memory _hospital) public {
        require(walletToDoctorId[_msgSender()] == 0, "Doctor already registered");
        
        // Grant DOCTOR role to the registering doctor centrally
        accessControl.grantRole(Roles.DOCTOR, _msgSender());
        
        doctorIdCounter++;
        walletToDoctorId[_msgSender()] = doctorIdCounter;

        DoctorDetails storage newDoctor = doctors[doctorIdCounter];
        newDoctor.doctorId = doctorIdCounter;
        newDoctor.name = _name;
        newDoctor.specialization = _specialization;
        newDoctor.email = _hospital;
    }

    // Allow functions to be called by admin OR doctors with DOCTOR role
    modifier onlyDoctorOrAdmin() {
        require(isAdmin(_msgSender()) || hasRole(Roles.DOCTOR, _msgSender()), "Not authorized");
        _;
    }

    function addPatient(uint256 _patientId) public onlyDoctorOrAdmin {
        uint256 doctorId = walletToDoctorId[_msgSender()];
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
        emit PatientAdded(doctorId, _patientId, _msgSender());
    }

    function getDoctorPatients() public view returns (uint256[] memory) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");
        return doctors[doctorId].patientIds;
    }

    function hasAccessToDocument(address _patient, string memory _ipfsHash) public view returns (bool) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] memory accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _patient &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash)) &&
                accessList[i].hasAccess
            ) {
                if (block.timestamp > accessList[i].grantTime + accessList[i].duration) {
                    return false;
                }
                return true;
            }
        }
        return false;
    }

    function requestAccess(address _patient, string memory _ipfsHash, string memory _fileName, uint256 _duration, string memory _reason) public onlyDoctorOrAdmin {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");

        doctorAccessList[doctorId].push(DocumentAccess({
            patient: _patient,
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            hasAccess: false,
            grantTime: 0,
            duration: _duration,
            reason: _reason,
            isEmergency: false,
            isResolved: false
        }));

        emit AccessRequested(_patient, _msgSender(), _ipfsHash, _fileName, _duration, _reason);
    }

    function grantAccess(address _doctor, string memory _ipfsHash, uint256 _duration) public {
        uint256 doctorId = walletToDoctorId[_doctor];
        require(doctorId != 0, "Doctor not registered");

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _msgSender() &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) ==
                keccak256(abi.encodePacked(_ipfsHash))
            ) {
                accessList[i].hasAccess = true;
                accessList[i].grantTime = block.timestamp;
                accessList[i].duration = _duration;

                emit AccessGranted(_msgSender(), _doctor, _ipfsHash, block.timestamp, _duration);
                return;
            }
        }
        revert("Access request not found");
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

    function declareEmergency(address _patient, string memory _ipfsHash, string memory _reason) public onlyRoleName(Roles.DOCTOR) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");
        require(bytes(_reason).length > 10, "Reason too short");

        doctorAccessList[doctorId].push(DocumentAccess({
            patient: _patient,
            ipfsHash: _ipfsHash,
            fileName: "EMERGENCY_ACCESS",
            hasAccess: true,
            grantTime: block.timestamp,
            duration: 2 hours, 
            reason: string(abi.encodePacked("EMERGENCY: ", _reason)),
            isEmergency: true,
            isResolved: false
        }));

        emit EmergencyAccessGranted(_msgSender(), _patient, _ipfsHash, _reason, block.timestamp);
    }

    function resolveEmergency(uint256 _doctorId, uint256 _accessIndex) public onlyAdmin() {
        require(_accessIndex < doctorAccessList[_doctorId].length, "Invalid access index");
        DocumentAccess storage access = doctorAccessList[_doctorId][_accessIndex];
        require(access.isEmergency, "Not an emergency access");
        
        access.isResolved = true;
        emit EmergencyResolved(access.patient, _msgSender(), access.ipfsHash, block.timestamp);
    }
}