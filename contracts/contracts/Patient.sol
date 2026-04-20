// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";
import "./libraries/StringUtils.sol";
import "./ConsentSBT.sol";

/**
 * @title Patient
 * @dev Full medical record management with EIP-712 Gasless Consent (Proxy Compatible).
 */
contract Patient is Initializable, ERC721Upgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable, EIP712Upgradeable, UUPSUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable {
    using StringUtils for bytes32;

    ConsentSBT public consentSBT;
    uint256 private _nextTokenId;

    bytes32 private constant GRANT_CONSENT_TYPEHASH = keccak256("GrantConsent(address doctor,string metadataURI,address patient,uint256 nonce)");
    mapping(address => uint256) public nonces;
    mapping(address => bytes32) public emergencyAccessHashes;


    // State
    mapping(address => uint256) public walletToPatientId;
    mapping(string => uint256) public usernameToPatientId;
    mapping(uint256 => uint256) private _tokenIdToPatientId;
    mapping(uint256 => uint256) private _tokenIdToRecordIndex;
    
    uint256 public patientCount;

    struct MedicalRecord {
        uint256 tokenId;
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
        uint256 age;
        string bloodGroup;
    }

    struct Nominee {
        string name;
        address walletAddress;
        string relationship;
        string contactNumber;
    }

    mapping(uint256 => PatientDetails) public patients;
    mapping(uint256 => MedicalRecord[]) public patientRecords;
    mapping(uint256 => Nominee[]) public patientNominees;

    event PatientRegistered(uint256 indexed patientId, address indexed wallet, string username);
    event MedicalRecordAdded(uint256 indexed patientId, uint256 tokenId, string ipfsHash);
    event ConsentGranted(address indexed patient, address indexed doctor, uint256 tokenId);
    event ConsentRevoked(address indexed patient, uint256 tokenId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _forwarder) ERC2771ContextUpgradeable(_forwarder) {
        // _disableInitializers(); // Temporarily disabled so standard truffle deployer can initialize it
    }

    function initialize(address _accessControl, address _sbt) public initializer {
        __ERC721_init("Sanjeevni Medical Record", "SMR");
        __ReentrancyGuard_init();
        __Pausable_init();
        __EIP712_init("Sanjeevni Patient", "1");
        __UUPSUpgradeable_init();
        __MediSecureAuth_init(_accessControl);

        consentSBT = ConsentSBT(_sbt);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}

    // Overrides for Context/ERC2771Context to resolve conflicts
    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (uint256) {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    // --- Patient Profile ---

    function registerPatient(
        string memory _username, 
        string memory _name, 
        string memory _email, 
        uint256 _age, 
        string memory _bloodGroup
    ) public whenNotPaused {
        require(walletToPatientId[_msgSender()] == 0, "Already registered");
        require(usernameToPatientId[_username] == 0, "Username taken");

        patientCount++;
        patients[patientCount] = PatientDetails({
            patientId: patientCount,
            username: _username,
            name: _name,
            walletAddress: _msgSender(),
            email: _email,
            age: _age,
            bloodGroup: _bloodGroup
        });
        walletToPatientId[_msgSender()] = patientCount;
        usernameToPatientId[_username] = patientCount;

        accessControl.grantRole(Roles.PATIENT, _msgSender());
        emit PatientRegistered(patientCount, _msgSender(), _username);
    }

    // --- Medical Records ---

    function addMedicalRecord(
        string memory _ipfsHash,
        string memory _fileName,
        string memory _recordDate,
        string memory _hospital,
        bool _isEmergencyViewable
    ) public whenNotPaused {
        uint256 pId = walletToPatientId[_msgSender()];
        require(pId != 0, "Not registered");

        uint256 tokenId = ++_nextTokenId;
        _safeMint(_msgSender(), tokenId);

        MedicalRecord memory record = MedicalRecord({
            tokenId: tokenId,
            ipfsHash: _ipfsHash,
            fileName: _fileName,
            recordDate: _recordDate,
            hospital: _hospital,
            isEmergencyViewable: _isEmergencyViewable
        });

        _tokenIdToPatientId[tokenId] = pId;
        _tokenIdToRecordIndex[tokenId] = patientRecords[pId].length;
        patientRecords[pId].push(record);

        emit MedicalRecordAdded(pId, tokenId, _ipfsHash);
    }

    // --- Gasless Consent (EIP-712) ---

    function grantConsent(address doctor, string memory metadataURI) public whenNotPaused {
        _executeGrantConsent(doctor, metadataURI, _msgSender());
    }

    function grantConsentWithSignature(
        address doctor,
        string calldata metadataURI,
        address patient,
        bytes calldata signature
    ) external whenNotPaused {
        bytes32 structHash = keccak256(abi.encode(
            GRANT_CONSENT_TYPEHASH,
            doctor,
            keccak256(bytes(metadataURI)),
            patient,
            nonces[patient]++
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, signature);
        require(signer == patient, "Invalid signature");

        _executeGrantConsent(doctor, metadataURI, patient);
    }

    function _executeGrantConsent(address doctor, string memory metadataURI, address patient) internal {
        require(walletToPatientId[patient] != 0, "Patient not registered");
        uint256 sbtId = consentSBT.mintConsent(patient, doctor, metadataURI);
        emit ConsentGranted(patient, doctor, sbtId);
    }

    function revokeConsent(uint256 tokenId) public whenNotPaused {
        consentSBT.revokeConsent(tokenId);
        emit ConsentRevoked(_msgSender(), tokenId);
    }

    function setEmergencyAccessHash(bytes32 _hash) public whenNotPaused {
        require(walletToPatientId[_msgSender()] != 0, "Not registered");
        emergencyAccessHashes[_msgSender()] = _hash;
    }

    function toggleEmergencyVisibility(uint256 index) public whenNotPaused {
        uint256 pId = walletToPatientId[_msgSender()];
        require(pId != 0, "Not registered");
        require(index < patientRecords[pId].length, "Invalid index");
        patientRecords[pId][index].isEmergencyViewable = !patientRecords[pId][index].isEmergencyViewable;
    }

    function addNominee(
        string memory _name, 
        address _wallet, 
        string memory _relationship, 
        string memory _contactNumber
    ) public whenNotPaused {
        uint256 pId = walletToPatientId[_msgSender()];
        require(pId != 0, "Not registered");
        patientNominees[pId].push(Nominee({
            name: _name,
            walletAddress: _wallet,
            relationship: _relationship,
            contactNumber: _contactNumber
        }));
    }


    // --- Getters ---

    function getNominees(uint256 pId) public view returns (Nominee[] memory) {
        return patientNominees[pId];
    }

    function getPatientMedicalRecords(address patient) public view returns (MedicalRecord[] memory) {
        return patientRecords[walletToPatientId[patient]];
    }

    // Added for frontend compatibility
    function getPatientDetails(uint256 pId) public view returns (PatientDetails memory) {
        return patients[pId];
    }

    // Added for frontend compatibility
    function getMedicalRecords(uint256 pId) public view returns (MedicalRecord[] memory) {
        return patientRecords[pId];
    }

    function isRegistered(address account) public view returns (bool) {

        return walletToPatientId[account] != 0;
    }

    function userExists(address account) public view returns (bool) {
        return isRegistered(account);
    }
}