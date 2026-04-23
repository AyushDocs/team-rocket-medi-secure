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



contract InsuranceUpgradeable is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable, MediSecureAuthUpgradeable, UUPSUpgradeable, ERC2771ContextUpgradeable {

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

    struct InsuranceProvider {
        string name;
        bool isActive;
        uint256 policyCount;
    }

    struct Policy {
        string name;
        uint256 basePremium;
        bool isActive;
        uint256 minAge;
        uint256 maxAge;
        uint256 coverageAmount;
    }

    struct InsuranceRequest {
        address patient;
        address provider;
        uint256 policyId;
        uint256 finalPremium;
        bool isVerified;
        bool isFinalized;
    }

    struct Claim {
        address patient;
        address provider;
        address hospitalAddress; 
        string procedureName;
        uint256 amount;
        bytes32 evidenceHash; 
        bool isSettled; 
        string status;
        uint256 timestamp;
    }

    mapping(address => InsuranceProvider) public insuranceProviders;
    mapping(uint256 => Policy) public policies;
    mapping(uint256 => InsuranceRequest) public insuranceRequests;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public patientPolicyIds;
    mapping(address => uint256[]) public providerClaims;

    uint256 private policyIdCounter;
    uint256 private requestIdCounter;
    uint256 private claimIdCounter;

    address public zkpVerifier;

    event InsuranceProviderRegistered(address indexed wallet, string name);
    event PolicyCreated(uint256 indexed policyId, address indexed provider, string name);
    event InsuranceQuoteRequested(uint256 indexed requestId, address indexed patient, address provider, uint256 policyId);
    event InsuranceProofVerified(uint256 indexed requestId, address indexed provider, uint256 discountPremium);
    event PolicyFinalized(uint256 indexed requestId, address indexed patient, address indexed provider);
    event ClaimSubmitted(uint256 indexed claimId, address indexed patient, address provider, string procedure, bytes32 evidenceHash);
    event ClaimProcessed(uint256 indexed claimId, string status);

    function initialize(address _accessControl) public initializer {
        __Pausable_init();
        __ReentrancyGuard_init();
        __MediSecureAuth_init(_accessControl);
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader() {}

    function setVerifier(address _verifier) public onlyAdmin() whenNotPaused {
        require(_verifier != address(0), "Invalid address");
        zkpVerifier = _verifier;
    }

    function registerInsuranceProvider(string memory _name) public whenNotPaused {
        require(!insuranceProviders[_msgSender()].isActive, "Already registered");
        require(bytes(_name).length > 0, "Invalid name");

        insuranceProviders[_msgSender()].name = _name;
        insuranceProviders[_msgSender()].isActive = true;
        insuranceProviders[_msgSender()].policyCount = 0;
        
        accessControl.grantRole(Roles.INSURANCE_PROVIDER, _msgSender());
        
        emit InsuranceProviderRegistered(_msgSender(), _name);
    }

    function createPolicy(
        string memory _name,
        uint256 _basePremium,
        uint256 _minAge,
        uint256 _maxAge,
        uint256 _coverageAmount
    ) public onlyRoleName(Roles.INSURANCE_PROVIDER) whenNotPaused {
        require(bytes(_name).length > 0, "Invalid name");
        require(_basePremium > 0, "Invalid premium");
        require(_maxAge > _minAge, "Invalid age range");

        policyIdCounter++;
        uint256 policyId = policyIdCounter;

        policies[policyId].name = _name;
        policies[policyId].basePremium = _basePremium;
        policies[policyId].isActive = true;
        policies[policyId].minAge = _minAge;
        policies[policyId].maxAge = _maxAge;
        policies[policyId].coverageAmount = _coverageAmount;

        insuranceProviders[_msgSender()].policyCount++;
        
        emit PolicyCreated(policyId, _msgSender(), _name);
    }

    function requestQuote(address _provider, uint256 _policyId) public whenNotPaused {
        require(insuranceProviders[_provider].isActive, "Provider not registered");
        require(policies[_policyId].isActive, "Policy not active");

        requestIdCounter++;
        uint256 requestId = requestIdCounter;

        insuranceRequests[requestId].patient = _msgSender();
        insuranceRequests[requestId].provider = _provider;
        insuranceRequests[requestId].policyId = _policyId;
        insuranceRequests[requestId].finalPremium = policies[_policyId].basePremium;
        insuranceRequests[requestId].isVerified = false;
        insuranceRequests[requestId].isFinalized = false;

        patientPolicyIds[_msgSender()].push(requestId);
        
        emit InsuranceQuoteRequested(requestId, _msgSender(), _provider, _policyId);
    }

    function verifyProof(uint256 _requestId) public onlyRoleName(Roles.INSURANCE_PROVIDER) whenNotPaused {
        require(insuranceRequests[_requestId].provider == _msgSender(), "Not your request");
        
        uint256 policyId = insuranceRequests[_requestId].policyId;
        uint256 basePremium = policies[policyId].basePremium;
        
        uint256 discountPremium = basePremium * 80 / 100;
        
        insuranceRequests[_requestId].isVerified = true;
        insuranceRequests[_requestId].finalPremium = discountPremium;
        
        emit InsuranceProofVerified(_requestId, _msgSender(), discountPremium);
    }

    function finalizePolicy(uint256 _requestId) public whenNotPaused {
        require(insuranceRequests[_requestId].patient == _msgSender(), "Not your request");
        require(insuranceRequests[_requestId].isVerified, "Not verified");
        
        insuranceRequests[_requestId].isFinalized = true;
        
        emit PolicyFinalized(_requestId, _msgSender(), insuranceRequests[_requestId].provider);
    }

    function submitClaim(
        address _provider,
        address _hospitalAddress,
        string memory _procedureName,
        uint256 _amount,
        bytes32 _evidenceHash
    ) public whenNotPaused {
        require(insuranceProviders[_provider].isActive, "Provider not active");
        require(_hospitalAddress != address(0), "Invalid hospital address");
        
        claimIdCounter++;
        uint256 claimId = claimIdCounter;

        claims[claimId].patient = _msgSender();
        claims[claimId].provider = _provider;
        claims[claimId].hospitalAddress = _hospitalAddress;
        claims[claimId].procedureName = _procedureName;
        claims[claimId].amount = _amount;
        claims[claimId].evidenceHash = _evidenceHash;
        claims[claimId].status = "SUBMITTED";
        claims[claimId].isSettled = false;
        claims[claimId].timestamp = block.timestamp;

        providerClaims[_provider].push(claimId);
        
        emit ClaimSubmitted(claimId, _msgSender(), _provider, _procedureName, _evidenceHash);
    }

    function processClaim(uint256 _claimId, string memory _status) public payable onlyRoleName(Roles.INSURANCE_PROVIDER) whenNotPaused {
        require(claims[_claimId].provider == _msgSender(), "Not your claim");
        require(!claims[_claimId].isSettled, "Already settled");
        
        claims[_claimId].status = _status;
        
        if (keccak256(bytes(_status)) == keccak256(bytes("APPROVED"))) {
            require(msg.value >= claims[_claimId].amount, "Insufficient funds for settlement");
            
            IHospital(claims[_claimId].hospitalAddress).receiveSettlement{value: claims[_claimId].amount}(claims[_claimId].hospitalAddress, claims[_claimId].patient);
            
            claims[_claimId].isSettled = true;
            
            if (msg.value > claims[_claimId].amount) {
                (bool refunded, ) = payable(_msgSender()).call{value: msg.value - claims[_claimId].amount}("");
                require(refunded, "Refund failed");
            }
        }
        
        emit ClaimProcessed(_claimId, _status);
    }

    uint256[50] private __gap;
}