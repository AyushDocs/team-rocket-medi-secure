// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {StringUtils} from "./libraries/StringUtils.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {MediSecureAuth} from "./common/MediSecureAuth.sol";
import {Roles} from "./MediSecureAccessControl.sol";
import {IHospital} from "./interfaces/IHospital.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ERC2771Context} from "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Doctor is ReentrancyGuard, Pausable, MediSecureAuth {
    constructor(address _accessControl, address _trustedForwarder) 
        MediSecureAuth(_accessControl, _trustedForwarder) 
    {}

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

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

    uint256 public constant RATE_LIMIT_WINDOW = 1 hours;
    uint256 public constant MAX_ACCESS_REQUESTS = 10;

    // Custom Errors
    error DoctorAlreadyRegistered();
    error DoctorNotRegistered();
    error InvalidAddress();
    error InvalidIpfsHash();
    error InvalidDuration();
    error RateLimitExceeded();
    error HospitalSystemNotSet();
    error NotOnDuty();
    error AccessRequestNotFound();
    error EmergencyRecordNotFound();
    error AccessRecordNotFound();
    error InvalidSpecialization();
    error PatientAlreadyAdded();

    mapping(address => uint256) public walletToDoctorId;
    mapping(uint256 => DoctorDetails) public doctors;
    mapping(uint256 => DocumentAccess[]) public doctorAccessList;
    mapping(address => uint256) private _lastAccessTime;
    mapping(address => uint256) private _accessCount;

    uint256 private doctorIdCounter;

    // Hospital Verification

    address public hospitalContract;

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



    function setHospitalContract(address addr) public onlyAdmin() whenNotPaused {
        if (addr == address(0)) revert InvalidAddress();
        hospitalContract = addr;
    }

    function registerDoctor(
        string memory name,
        string memory specialization,
        string memory hospital
    ) public {
        if (walletToDoctorId[_msgSender()] != 0) revert DoctorAlreadyRegistered();
        doctorIdCounter++;
        walletToDoctorId[_msgSender()] = doctorIdCounter;
 
        DoctorDetails storage newDoctor = doctors[doctorIdCounter];
        newDoctor.doctorId = doctorIdCounter;
        newDoctor.name = name;
        newDoctor.specialization = specialization;
        newDoctor.email = hospital; // Keeping legacy field mapping for now
        
        // Grant role automatically
        accessControl.grantRole(Roles.DOCTOR, _msgSender());
    }

    function addPatient(uint256 patientId) public {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
 
        uint256[] storage patientIds = doctors[doctorId].patientIds;
        for (uint256 i = 0; i < patientIds.length; i++) {
            if (patientIds[i] == patientId) revert PatientAlreadyAdded();
        }
 
        patientIds.push(patientId);
        emit PatientAdded(doctorId, patientId, _msgSender());
    }

    function getDoctorPatients() public view returns (uint256[] memory) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
        return doctors[doctorId].patientIds;
    }

    function hasAccessToDocument(
        address patient,
        string memory ipfsHash
    ) public view returns (bool) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
 
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == patient &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash)) &&
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

    function requestAccess(
        address patient,
        string memory ipfsHash,
        string memory fileName,
        uint256 duration,
        string memory reason
    ) public whenNotPaused nonReentrant {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
 
        if (patient == address(0)) revert InvalidAddress();
        if (bytes(ipfsHash).length == 0) revert InvalidIpfsHash();
        if (duration == 0 || duration > 365 days) revert InvalidDuration();
 
        if (block.timestamp < _lastAccessTime[_msgSender()] + RATE_LIMIT_WINDOW) {
            if (_accessCount[_msgSender()] >= MAX_ACCESS_REQUESTS) revert RateLimitExceeded();
            _accessCount[_msgSender()]++;
        } else {
            _lastAccessTime[_msgSender()] = block.timestamp;
            _accessCount[_msgSender()] = 1;
        }

        doctorAccessList[doctorId].push(
            DocumentAccess({
                patient: patient,
                ipfsHash: ipfsHash,
                fileName: fileName,
                hasAccess: false,
                grantTime: 0,
                duration: duration,
                reason: reason,
                isEmergency: false,
                isResolved: false
            })
        );

        emit AccessRequested(
            patient,
            _msgSender(),
            ipfsHash,
            fileName,
            duration,
            reason
        );
    }

    function emergencyBreakGlass(
        address patient,
        string memory ipfsHash,
        string memory fileName,
        string memory reason,
        address hospitalAddress
    ) public whenNotPaused nonReentrant {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
        if (hospitalContract == address(0)) revert HospitalSystemNotSet();
        if (patient == address(0)) revert InvalidAddress();
        
        // Verify with Hospital Contract
        if (!IHospital(hospitalContract).isDoctorOnDuty(_msgSender(), hospitalAddress)) revert NotOnDuty();

        doctorAccessList[doctorId].push(
            DocumentAccess({
                patient: patient,
                ipfsHash: ipfsHash,
                fileName: fileName,
                hasAccess: true, // Auto Grant
                grantTime: block.timestamp,
                duration: 24 hours, // Fixed duration for emergency
                reason: reason,
                isEmergency: true,
                isResolved: false
            })
        );

        emit EmergencyAccessGranted(
            _msgSender(),
            patient,
            ipfsHash,
            reason,
            block.timestamp
        );
    }

    function grantAccess(
        address doctor,
        string memory ipfsHash,
        uint256 duration
    ) public {
        uint256 doctorId = walletToDoctorId[doctor];
        if (doctorId == 0) revert DoctorNotRegistered();
 
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _msgSender() &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash))
            ) {
                accessList[i].hasAccess = true;
                accessList[i].grantTime = block.timestamp;
                accessList[i].duration = duration;
 
                emit AccessGranted(
                    _msgSender(),
                    doctor,
                    ipfsHash,
                    block.timestamp,
                    duration
                );
                return;
            }
        }
        revert AccessRequestNotFound();
    }

    function resolveEmergency(address doctor, string memory ipfsHash) public {
        uint256 doctorId = walletToDoctorId[doctor];
        if (doctorId == 0) revert DoctorNotRegistered();

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _msgSender() &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash)) &&
                accessList[i].isEmergency
            ) {
                accessList[i].isResolved = true;
                emit EmergencyResolved(
                    _msgSender(),
                    _msgSender(),
                    ipfsHash,
                    block.timestamp
                );
                return;
            }
        }
        revert EmergencyRecordNotFound();
    }

    function revokeAccess(address doctor, string memory ipfsHash) public {
        uint256 doctorId = walletToDoctorId[doctor];
        if (doctorId == 0) revert DoctorNotRegistered();

        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        for (uint256 i = 0; i < accessList.length; i++) {
            if (
                accessList[i].patient == _msgSender() &&
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) == keccak256(abi.encodePacked(ipfsHash))
            ) {
                accessList[i].hasAccess = false;
                if (accessList[i].isEmergency) {
                    accessList[i].isResolved = true;
                }
                emit AccessRevoked(
                    _msgSender(),
                    doctor,
                    ipfsHash,
                    block.timestamp
                );
                return;
            }
        }
        revert AccessRecordNotFound();
    }

    // --- GETTERS ---
    function getAccessList() public view returns (DocumentAccess[] memory) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();
        return doctorAccessList[doctorId];
    }

    function getPatients() public view returns (DoctorDetails[] memory) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) revert DoctorNotRegistered();

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

    function getDoctorsBySpecialization(string calldata specialization) public view returns (DoctorDetails[] memory) {
        uint256 total = doctorIdCounter;
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (keccak256(abi.encodePacked(doctors[i].specialization)) == keccak256(abi.encodePacked(specialization))) {
                count++;
            }
        }
        
        DoctorDetails[] memory result = new DoctorDetails[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (keccak256(abi.encodePacked(doctors[i].specialization)) == keccak256(abi.encodePacked(specialization))) {
                result[idx] = doctors[i];
                idx++;
            }
        }
        return result;
    }

    function searchDoctors(string calldata query) public view returns (DoctorDetails[] memory) {
        uint256 total = doctorIdCounter;
        uint256 count = 0;
        
        for (uint256 i = 1; i <= total; i++) {
            DoctorDetails memory d = doctors[i];
            if (StringUtils.contains(d.name, query) || StringUtils.contains(d.specialization, query)) {
                count++;
            }
        }
        
        DoctorDetails[] memory result = new DoctorDetails[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            DoctorDetails memory d = doctors[i];
            if (StringUtils.contains(d.name, query) || StringUtils.contains(d.specialization, query)) {
                result[idx] = d;
                idx++;
            }
        }
        return result;
    }

    function cleanupExpiredAccess(uint256 doctorId) public returns (uint256 cleanedCount) {
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        uint256 removedCount = 0;
        
        for (uint256 i = 0; i < accessList.length; i++) {
            DocumentAccess storage doc = accessList[i];
            if (doc.hasAccess && !doc.isResolved && doc.grantTime + doc.duration <= block.timestamp) {
                doc.hasAccess = false;
                removedCount++;
            }
        }
        
        return removedCount;
    }

    function cleanupExpiredAccessForAll() public returns (uint256 totalCleaned) {
        totalCleaned = 0;
        
        for (uint256 i = 1; i <= doctorIdCounter; i++) {
            DocumentAccess[] storage accessList = doctorAccessList[i];
            for (uint256 j = 0; j < accessList.length; j++) {
                DocumentAccess storage doc = accessList[j];
                if (doc.hasAccess && !doc.isResolved && doc.grantTime + doc.duration <= block.timestamp) {
                    doc.hasAccess = false;
                    totalCleaned++;
                }
            }
        }
        
        return totalCleaned;
    }

    function getExpiredAccessCount(uint256 doctorId) public view returns (uint256 count) {
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        
        for (uint256 i = 0; i < accessList.length; i++) {
            DocumentAccess storage doc = accessList[i];
            if (doc.hasAccess && !doc.isResolved && doc.grantTime + doc.duration <= block.timestamp) {
                count++;
            }
        }
        
        return count;
    }

    function isAccessExpired(uint256 doctorId, address patient) public view returns (bool) {
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        
        for (uint256 i = 0; i < accessList.length; i++) {
            DocumentAccess storage doc = accessList[i];
            if (doc.patient == patient && doc.hasAccess) {
                return doc.grantTime + doc.duration <= block.timestamp;
            }
        }
        
        return true;
    }

    // --- PAUSE FUNCTIONS ---
    function pauseContract() public onlyAdmin() {
        _pause();
    }

    function unpauseContract() public onlyAdmin() {
        _unpause();
    }

    // --- ACCESS CONTROL HELPERS ---
    function grantDoctorRole(address doctor) public onlyAdmin() {
        accessControl.grantRole(Roles.DOCTOR, doctor);
    }

    function revokeDoctorRole(address doctor) public onlyAdmin() {
        accessControl.revokeRole(Roles.DOCTOR, doctor);
    }

    function isDoctorRole(address account) public view returns (bool) {
        return accessControl.hasRole(Roles.DOCTOR, account);
    }
}
