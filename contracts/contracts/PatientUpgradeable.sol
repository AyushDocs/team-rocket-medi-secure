// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";

contract PatientUpgradeable is Initializable, UUPSUpgradeable, PausableUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable {
    
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

    uint256 private _nextTokenId;
    uint256 private patientIdCounter;
    
    mapping(address => uint256) public walletToPatientId;
    mapping(string => uint256) public usernameToPatientId;
    
    struct PatientDetails {
        string username;
        string name;
        string email;
        uint8 age;
        string bloodGroup;
    }
    
    mapping(uint256 => PatientDetails) public patients;
    mapping(uint256 => string[]) public patientRecords;
    
    event PatientRegistered(uint256 indexed patientId, address indexed wallet, string name);
    event RecordAdded(uint256 indexed patientId, uint256 indexed tokenId, string ipfsHash);

    function initialize(address _accessControl) public initializer {
        __Pausable_init();
        __MediSecureAuth_init(_accessControl);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader() {}

    function registerPatient(
        string memory _username,
        string memory _name,
        string memory _email,
        uint8 _age,
        string memory _bloodGroup
    ) public whenNotPaused {
        require(walletToPatientId[_msgSender()] == 0, "Already registered");
        require(usernameToPatientId[_username] == 0, "Username taken");

        patientIdCounter++;
        uint256 patientId = patientIdCounter;
        
        walletToPatientId[_msgSender()] = patientId;
        usernameToPatientId[_username] = patientId;
        
        patients[patientId].username = _username;
        patients[patientId].name = _name;
        patients[patientId].email = _email;
        patients[patientId].age = _age;
        patients[patientId].bloodGroup = _bloodGroup;
        
        emit PatientRegistered(patientId, _msgSender(), _name);
    }

    function addMedicalRecord(string memory _ipfsHash) public whenNotPaused {
        uint256 patientId = walletToPatientId[_msgSender()];
        require(patientId != 0, "Not registered");
        
        _nextTokenId++;
        patientRecords[patientId].push(_ipfsHash);
        
        emit RecordAdded(patientId, _nextTokenId, _ipfsHash);
    }

    function isRegistered(address account) public view returns (bool) {
        return walletToPatientId[account] != 0;
    }

    function userExists(address account) public view returns (bool) {
        return isRegistered(account);
    }

    uint256[50] private __gap;
}