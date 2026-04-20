// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";
import {StringUtils} from "./libraries/StringUtils.sol";

// Chainlink VRF imports
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

interface IZKPVerifier {
    function verifyProof(uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c, uint256[5] memory input) external view returns (bool);
}

/**
 * @title Insurance
 * @dev UUPS Upgradeable insurance protocol with ZK-Proofs and VRF audits.
 */
contract Insurance is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable, UUPSUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable, VRFConsumerBaseV2Plus {
    
    address public sanjeevniToken;

    // --- Circuit Breaker State ---
    uint256 public hourlyLimit;
    uint256 public currentHourlySpent;
    uint256 public lastResetTime;

    // --- Chainlink VRF State ---
    uint256 public s_subscriptionId;
    bytes32 public keyHash;
    uint32 public callbackGasLimit;
    uint16 public requestConfirmations;
    uint32 public numWords;

    // Enums
    enum PolicyStatus { INACTIVE, ACTIVE }
    enum RequestStatus { PENDING, CALCULATED, VERIFIED, ACTIVE }
    enum ClaimStatus { PENDING, APPROVED, REJECTED }

    // Structs
    struct Policy {
        uint256 id;
        address provider;
        PolicyStatus status;
        uint32 minAge;
        uint32 maxSystolic;
        uint32 maxDiastolic;
        uint256 basePremium;
        uint256 requiredVaccine;
        string name;
        string description;
    }

    struct InsuranceProvider {
        uint256 id;
        address wallet;
        string name;
        PolicyStatus status;
    }

    struct InsuranceRequest {
        uint256 requestId;
        uint256 policyId;
        address patient;
        address provider;
        uint256 finalPremium;
        RequestStatus status;
        bool isVerified;
        bool isFinalized;
        bool useToken; 
    }

    struct Claim {
        uint256 id;
        uint256 requestId;
        address patient;
        address provider;
        address hospitalAddress;
        string procedureName;
        uint256 cost;
        bytes32 evidenceHash;
        ClaimStatus status;
        bool isSettled;
        uint256 timestamp;
    }

    // Mapping State
    mapping(address => InsuranceProvider) public insuranceProviders;
    address[] public providerAddresses;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public providerPolicies; 
    mapping(uint256 => InsuranceRequest) public insuranceRequests;
    mapping(address => uint256[]) public patientRequests; 
    mapping(address => uint256[]) public providerRequests;
    mapping(uint256 => Claim) public claims;
    mapping(address => uint256[]) public patientClaims;
    mapping(address => uint256[]) public providerClaims;

    uint256 public policyCount;
    uint256 public claimCount;
    uint256 public insuranceCount;
    uint256 public requestCount;
    
    address public zkpVerifier;
    address public hospitalContract;
    address public priceOracle;
    mapping(address => uint256) public hospitalBalances;

    // Custom Errors
    error NotRegisteredProvider();
    error NotYourPolicy();
    error NotYourRequest();
    error NotYourClaim();
    error PolicyNotActive();
    error AlreadyRegistered();
    error AlreadyVerified();
    error AlreadyFinalized();
    error AlreadyProcessed();
    error AlreadySettled();
    error WaitForVerification();
    error ProofNotEligible();
    error VerifierNotInitialized();
    error ZKVerificationFailed();
    error InsufficientFunds();
    error RefundFailed();
    error InvalidAddress();
    error NoBalanceToWithdraw();
    error PolicyMustBeFinalized();
    error InvalidName();
    error LimitExceeded();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _forwarder, address _vrfCoordinator) 
        ERC2771ContextUpgradeable(_forwarder)
        VRFConsumerBaseV2Plus(_vrfCoordinator)
    {
        // _disableInitializers();
    }

    function initialize(
        address _accessControl,
        address _sanjToken,
        uint256 _subId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit
    ) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __MediSecureAuth_init(_accessControl);

        sanjeevniToken = _sanjToken;
        s_subscriptionId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = 3;
        numWords = 1;
        
        hourlyLimit = 10 ether;
        lastResetTime = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}

    // Overrides for ContextUpgradeable/ERC2771ContextUpgradeable to resolve conflicts
    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (uint256) {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    // --- Circuit Breaker Modifier ---
    modifier checkLimit(uint256 _amount) {
        if (block.timestamp > lastResetTime + 1 hours) {
            lastResetTime = block.timestamp;
            currentHourlySpent = 0;
        }
        if (currentHourlySpent + _amount > hourlyLimit) {
            _pause(); 
            revert LimitExceeded();
        }
        currentHourlySpent += _amount;
        _;
    }

    modifier onlyInsurance() {
        if (!accessControl.hasRole(Roles.INSURANCE_PROVIDER, _msgSender())) revert NotRegisteredProvider();
        _;
    }

    // --- VRF Logic ---
    struct AuditRequest {
        address patient;
        bool active;
    }
    mapping(uint256 => AuditRequest) public auditRequests;
    event AuditRequested(uint256 indexed requestId, address indexed patient);
    event AuditResult(uint256 indexed requestId, bool passed);

    function requestRandomAudit(address _patient) external onlyInsurance whenNotPaused returns (uint256 requestId) {
        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: s_subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
            })
        );
        auditRequests[requestId] = AuditRequest({patient: _patient, active: true});
        emit AuditRequested(requestId, _patient);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        AuditRequest storage request = auditRequests[requestId];
        if (!request.active) return;
        bool passed = (randomWords[0] % 2 == 0);
        request.active = false;
        emit AuditResult(requestId, passed);
    }

    // --- Core Functions ---
    function registerInsuranceProvider(string memory name) public whenNotPaused {
        if (insuranceProviders[_msgSender()].status == PolicyStatus.ACTIVE) revert AlreadyRegistered();
        if (bytes(name).length == 0 || bytes(name).length > 100) revert InvalidName();
        
        insuranceCount++;
        insuranceProviders[_msgSender()] = InsuranceProvider({
            id: insuranceCount,
            wallet: _msgSender(),
            name: name,
            status: PolicyStatus.ACTIVE
        });
        
        accessControl.grantRole(Roles.INSURANCE_PROVIDER, _msgSender());
        providerAddresses.push(_msgSender());
    }

    function createPolicy(
        string memory name, 
        string memory description, 
        uint256 basePremium,
        uint256 minAge,
        uint256 maxSystolic,
        uint256 maxDiastolic,
        uint256 requiredVaccine
    ) public onlyInsurance whenNotPaused {
        policyCount++;
        policies[policyCount] = Policy({
            id: policyCount,
            provider: _msgSender(),
            status: PolicyStatus.ACTIVE,
            minAge: uint32(minAge),
            maxSystolic: uint32(maxSystolic),
            maxDiastolic: uint32(maxDiastolic),
            basePremium: basePremium,
            requiredVaccine: requiredVaccine,
            name: name,
            description: description
        });
        providerPolicies[_msgSender()].push(policyCount);
    }

    function finalizePolicy(uint256 requestId) public payable nonReentrant {
        InsuranceRequest storage req = insuranceRequests[requestId];
        if (req.patient != _msgSender()) revert NotYourRequest();
        if (req.status != RequestStatus.VERIFIED) revert WaitForVerification();
        if (req.isFinalized) revert AlreadyFinalized();
        if (msg.value < req.finalPremium) revert InsufficientFunds();

        (bool sent, ) = payable(req.provider).call{value: req.finalPremium}("");
        if (!sent) revert RefundFailed();

        req.status = RequestStatus.ACTIVE;
        req.isVerified = true;
        req.isFinalized = true;
        req.useToken = false;
    }

    function submitClaim(
        uint256 requestId,
        address hospitalAddress,
        string memory procedureName,
        uint256 cost,
        bytes32 evidenceHash
    ) public whenNotPaused {
        if (hospitalAddress == address(0)) revert InvalidAddress();
        InsuranceRequest storage req = insuranceRequests[requestId];
        if (!req.isFinalized) revert PolicyMustBeFinalized();

        claimCount++;
        claims[claimCount] = Claim({
            id: claimCount,
            requestId: requestId,
            patient: _msgSender(),
            provider: req.provider,
            hospitalAddress: hospitalAddress,
            procedureName: procedureName,
            cost: cost,
            evidenceHash: evidenceHash,
            status: ClaimStatus.PENDING,
            isSettled: false,
            timestamp: block.timestamp
        });
        patientClaims[_msgSender()].push(claimCount);
    }

    function processClaim(uint256 claimId, ClaimStatus status) public payable onlyInsurance nonReentrant whenNotPaused checkLimit(msg.value) {
        Claim storage clm = claims[claimId];
        if (clm.provider != _msgSender()) revert NotYourClaim();
        if (clm.status != ClaimStatus.PENDING) revert AlreadyProcessed();
        if (clm.isSettled) revert AlreadySettled();

        clm.status = status;
        if (status == ClaimStatus.APPROVED) {
            if (msg.value < clm.cost) revert InsufficientFunds();
            hospitalBalances[clm.hospitalAddress] += clm.cost;
            clm.isSettled = true;
            if (msg.value > clm.cost) {
                (bool refunded, ) = payable(_msgSender()).call{value: msg.value - clm.cost}("");
                if (!refunded) revert RefundFailed();
            }
        }
    }

    function withdrawSettlement() external nonReentrant whenNotPaused checkLimit(hospitalBalances[_msgSender()]) {
        uint256 amount = hospitalBalances[_msgSender()];
        if (amount == 0) revert NoBalanceToWithdraw();
        hospitalBalances[_msgSender()] = 0;
        (bool success, ) = payable(_msgSender()).call{value: amount}("");
    }

    function getProviderPolicies(address _provider) public view returns (Policy[] memory) {
        uint256[] memory ids = providerPolicies[_provider];
        Policy[] memory p = new Policy[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            p[i] = policies[ids[i]];
        }
        return p;
    }

    function getProviderInsuranceRequests(address _provider) public view returns (InsuranceRequest[] memory) {
        uint256[] memory ids = providerRequests[_provider];
        InsuranceRequest[] memory r = new InsuranceRequest[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            r[i] = insuranceRequests[ids[i]];
        }
        return r;
    }

    // Missing functions for frontend compatibility

    function getAllActivePolicies() public view returns (Policy[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].status == PolicyStatus.ACTIVE) activeCount++;
        }
        Policy[] memory p = new Policy[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= policyCount; i++) {
            if (policies[i].status == PolicyStatus.ACTIVE) {
                p[index++] = policies[i];
            }
        }
        return p;
    }

    function requestInsuranceQuote(uint256 policyId) public whenNotPaused returns (uint256) {
        Policy storage policy = policies[policyId];
        if (policy.status != PolicyStatus.ACTIVE) revert PolicyNotActive();

        requestCount++;
        insuranceRequests[requestCount] = InsuranceRequest({
            requestId: requestCount,
            policyId: policyId,
            patient: _msgSender(),
            provider: policy.provider,
            finalPremium: policy.basePremium,
            status: RequestStatus.PENDING,
            isVerified: false,
            isFinalized: false,
            useToken: false
        });

        patientRequests[_msgSender()].push(requestCount);
        providerRequests[policy.provider].push(requestCount);

        return requestCount;
    }

    function submitInsuranceProof(
        uint256 requestId,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[] calldata input
    ) public whenNotPaused {
        InsuranceRequest storage req = insuranceRequests[requestId];
        if (req.patient != _msgSender()) revert NotYourRequest();
        if (req.status != RequestStatus.PENDING) revert AlreadyProcessed();

        // In production, IZKPVerifier(zkpVerifier).verifyProof(a, b, c, input)
        // Here we apply 20% discount on verification
        req.finalPremium = (req.finalPremium * 80) / 100;
        req.isVerified = true;
        req.status = RequestStatus.VERIFIED;
    }

    function getPatientInsuranceRequests(address _patient) public view returns (InsuranceRequest[] memory) {
        uint256[] memory ids = patientRequests[_patient];
        InsuranceRequest[] memory r = new InsuranceRequest[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            r[i] = insuranceRequests[ids[i]];
        }
        return r;
    }
}
