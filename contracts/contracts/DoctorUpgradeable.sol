// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";
import "./interfaces/IHospital.sol";

contract DoctorUpgradeable is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable, MediSecureAuthUpgradeable, UUPSUpgradeable, ERC2771ContextUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _forwarder) ERC2771ContextUpgradeable(_forwarder) {
        // _disableInitializers();
    }

    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (uint256) {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }
    
    address public hospitalContract;

    struct DoctorDetails {
        string name;
        string specialization;
        string email;
        string hospital;
        uint256[] patientIds;
        bool isActive;
    }

    struct DocumentAccess {
        address patient;
        string ipfsHash;
        bool hasAccess;
        uint256 grantTime;
        uint256 duration;
        string reason;
        bool isEmergency;
    }

    mapping(address => uint256) public walletToDoctorId;
    mapping(uint256 => DoctorDetails) public doctors;
    mapping(uint256 => DocumentAccess[]) public doctorAccessList;
    
    uint256 private doctorIdCounter;

    event DoctorRegistered(uint256 indexed doctorId, address indexed wallet, string name);
    event AccessRequested(address indexed patient, address indexed doctor, string ipfsHash, string fileName, uint256 duration, string reason);
    event AccessGranted(address indexed patient, address indexed doctor, string ipfsHash, uint256 grantTime, uint256 duration);
    event EmergencyAccessGranted(address indexed patient, address indexed doctor, string ipfsHash, string reason, uint256 timestamp);

    function initialize(address _accessControl) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __MediSecureAuth_init(_accessControl);
        __UUPSUpgradeable_init();
    }

    function setHospitalContract(address _hospital) public onlyAdmin() {
        require(_hospital != address(0), "Invalid hospital");
        hospitalContract = _hospital;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader() {}

    function registerDoctor(
        string memory _name,
        string memory _specialization,
        string memory _email,
        string memory _hospital
    ) public whenNotPaused {
        require(walletToDoctorId[_msgSender()] == 0, "Already registered");
        require(bytes(_name).length > 0, "Invalid name");
        require(bytes(_specialization).length > 0, "Invalid specialization");

        doctorIdCounter++;
        uint256 doctorId = doctorIdCounter;
        
        walletToDoctorId[_msgSender()] = doctorId;
        
        doctors[doctorId].name = _name;
        doctors[doctorId].specialization = _specialization;
        doctors[doctorId].email = _email;
        doctors[doctorId].hospital = _hospital;
        doctors[doctorId].isActive = true;
        
        accessControl.grantRole(Roles.DOCTOR, _msgSender());
        
        emit DoctorRegistered(doctorId, _msgSender(), _name);
    }

    function requestAccess(
        address _patient,
        string memory _ipfsHash,
        string memory _fileName,
        uint256 _duration,
        string memory _reason
    ) public whenNotPaused onlyRoleName(Roles.DOCTOR) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");
        require(_patient != address(0), "Invalid patient");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");

        doctorAccessList[doctorId].push(DocumentAccess({
            patient: _patient,
            ipfsHash: _ipfsHash,
            hasAccess: false,
            grantTime: 0,
            duration: _duration,
            reason: _reason,
            isEmergency: false
        }));

        emit AccessRequested(_patient, _msgSender(), _ipfsHash, _fileName, _duration, _reason);
    }

    function emergencyBreakGlass(
        address _patient,
        string memory _ipfsHash,
        string memory _reason,
        address _hospitalAddress
    ) public whenNotPaused onlyRoleName(Roles.DOCTOR) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");
        
        require(IHospital(hospitalContract).isDoctorOnDuty(_msgSender(), _hospitalAddress), "Not on duty at this hospital");

        doctorAccessList[doctorId].push(DocumentAccess({
            patient: _patient,
            ipfsHash: _ipfsHash,
            hasAccess: true,
            grantTime: block.timestamp,
            duration: 1 hours,
            reason: _reason,
            isEmergency: true
        }));

        emit EmergencyAccessGranted(_patient, _msgSender(), _ipfsHash, _reason, block.timestamp);
    }

    function grantAccess(uint256 _accessIndex) public onlyRoleName(Roles.DOCTOR) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        require(doctorId != 0, "Doctor not registered");
        require(_accessIndex < doctorAccessList[doctorId].length, "Invalid index");
        
        DocumentAccess storage access = doctorAccessList[doctorId][_accessIndex];
        access.hasAccess = true;
        access.grantTime = block.timestamp;
        
        emit AccessGranted(access.patient, _msgSender(), access.ipfsHash, access.grantTime, access.duration);
    }

    function hasAccessToDocument(address _patient, string memory _ipfsHash) public view returns (bool) {
        uint256 doctorId = walletToDoctorId[_msgSender()];
        if (doctorId == 0) return false;
        
        DocumentAccess[] storage accessList = doctorAccessList[doctorId];
        
        for (uint256 i = 0; i < accessList.length; i++) {
            if (accessList[i].patient == _patient && 
                keccak256(abi.encodePacked(accessList[i].ipfsHash)) == keccak256(abi.encodePacked(_ipfsHash)) &&
                accessList[i].hasAccess &&
                accessList[i].grantTime + accessList[i].duration > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    function doctorExists(address account) public view returns (bool) {
        return walletToDoctorId[account] != 0;
    }

    uint256[50] private __gap;
}