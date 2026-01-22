// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Insurance
 * @dev Manages insurance providers and quote requests using ZK-Proofs for privacy-preserving premium calculation.
 */
contract Insurance is ReentrancyGuard {
    struct Policy {
        uint256 id;
        address provider;
        string name;
        string description;
        uint256 basePremium;
        bool isActive;
        uint256 minAge;
        uint256 maxSystolic;
        uint256 maxDiastolic;
        uint256 requiredVaccine;
    }

    struct InsuranceProvider {
        uint256 id;
        address wallet;
        string name;
        bool isActive;
    }

    struct InsuranceRequest {
        uint256 requestId;
        uint256 policyId;
        address patient;
        address provider;
        uint256 finalPremium;
        bool isVerified;
        bool isCalculated;
        bool isFinalized;
    }

    // State Variables
    mapping(address => InsuranceProvider) public insuranceProviders;
    address[] public providerAddresses;
    
    mapping(uint256 => Policy) public policies;
    uint256 public policyCount = 0;
    mapping(address => uint256[]) public providerPolicies; // provider -> policy IDs

    mapping(uint256 => InsuranceRequest) public insuranceRequests;
    mapping(address => uint256[]) public patientRequests; // patient address -> request IDs
    mapping(address => uint256[]) public providerRequests; // provider address -> request IDs
    
    uint256 public insuranceCount = 0;
    uint256 public requestCount = 0;
    
    address public zkpVerifier;

    // Events
    event InsuranceProviderRegistered(address indexed wallet, string name);
    event PolicyCreated(uint256 indexed policyId, address indexed provider, string name);
    event PolicyUpdated(uint256 indexed policyId, string name, uint256 basePremium);
    event InsuranceQuoteRequested(uint256 indexed requestId, address indexed patient, address indexed provider, uint256 policyId);
    event InsuranceProofVerified(uint256 indexed requestId, address indexed patient, uint256 discountPremium);
    event PolicyFinalized(uint256 indexed requestId, address indexed patient);

    // --- Modifiers ---
    modifier onlyInsurance() {
        require(insuranceProviders[msg.sender].isActive, "Not a registered provider");
        _;
    }

    // --- Functions ---

    function setVerifier(address _verifier) public {
        zkpVerifier = _verifier;
    }

    function registerInsuranceProvider(string memory _name) public {
        require(!insuranceProviders[msg.sender].isActive, "Already registered");
        
        insuranceCount++;
        insuranceProviders[msg.sender] = InsuranceProvider({
            id: insuranceCount,
            wallet: msg.sender,
            name: _name,
            isActive: true
        });
        providerAddresses.push(msg.sender);

        emit InsuranceProviderRegistered(msg.sender, _name);
    }

    function createPolicy(
        string memory _name, 
        string memory _description, 
        uint256 _basePremium,
        uint256 _minAge,
        uint256 _maxSystolic,
        uint256 _maxDiastolic,
        uint256 _requiredVaccine
    ) public onlyInsurance {
        policyCount++;
        policies[policyCount] = Policy({
            id: policyCount,
            provider: msg.sender,
            name: _name,
            description: _description,
            basePremium: _basePremium,
            isActive: true,
            minAge: _minAge,
            maxSystolic: _maxSystolic,
            maxDiastolic: _maxDiastolic,
            requiredVaccine: _requiredVaccine
        });
        providerPolicies[msg.sender].push(policyCount);
        emit PolicyCreated(policyCount, msg.sender, _name);
    }

    function updatePolicy(
        uint256 _policyId, 
        string memory _name, 
        string memory _description, 
        uint256 _basePremium, 
        bool _isActive,
        uint256 _minAge,
        uint256 _maxSystolic,
        uint256 _maxDiastolic,
        uint256 _requiredVaccine
    ) public onlyInsurance {
        require(policies[_policyId].provider == msg.sender, "Not your policy");
        
        policies[_policyId].name = _name;
        policies[_policyId].description = _description;
        policies[_policyId].basePremium = _basePremium;
        policies[_policyId].isActive = _isActive;
        policies[_policyId].minAge = _minAge;
        policies[_policyId].maxSystolic = _maxSystolic;
        policies[_policyId].maxDiastolic = _maxDiastolic;
        policies[_policyId].requiredVaccine = _requiredVaccine;

        emit PolicyUpdated(_policyId, _name, _basePremium);
    }

    function requestInsuranceQuote(uint256 _policyId) public {
        Policy storage policy = policies[_policyId];
        require(policy.isActive, "Policy is not active");
        
        requestCount++;
        insuranceRequests[requestCount] = InsuranceRequest({
            requestId: requestCount,
            policyId: _policyId,
            patient: msg.sender,
            provider: policy.provider,
            finalPremium: policy.basePremium,
            isVerified: false,
            isCalculated: false,
            isFinalized: false
        });

        patientRequests[msg.sender].push(requestCount);
        providerRequests[policy.provider].push(requestCount);
        emit InsuranceQuoteRequested(requestCount, msg.sender, policy.provider, _policyId);
    }

    function submitInsuranceProof(
        uint256 _requestId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[5] memory input
    ) public nonReentrant {
        InsuranceRequest storage req = insuranceRequests[_requestId];
        require(req.patient == msg.sender, "Not your request");
        require(!req.isVerified, "Already verified");
        require(input[0] == 1, "Proof shows not eligible");

        if (zkpVerifier != address(0)) {
            (bool success, bytes memory data) = zkpVerifier.call(
                abi.encodeWithSignature("verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[5])", a, b, c, input)
            );
            require(success && abi.decode(data, (bool)), "ZK Proof Verification Failed");
        }

        req.isVerified = true;
        req.isCalculated = true;
        req.finalPremium = (req.finalPremium * 80) / 100;

        emit InsuranceProofVerified(_requestId, msg.sender, req.finalPremium);
    }

    function finalizePolicy(uint256 _requestId) public onlyInsurance {
        InsuranceRequest storage req = insuranceRequests[_requestId];
        require(req.provider == msg.sender, "Not your request");
        require(!req.isFinalized, "Already finalized");
        require(req.isVerified, "Wait for verification");

        req.isFinalized = true;
        emit PolicyFinalized(_requestId, req.patient);
    }

    function getProviderPolicies(address _provider) public view returns (Policy[] memory) {
        uint256[] memory ids = providerPolicies[_provider];
        Policy[] memory pols = new Policy[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            pols[i] = policies[ids[i]];
        }
        return pols;
    }

    function getAllActivePolicies() public view returns (Policy[] memory) {
        uint256 activeCount = 0;
        for(uint i = 1; i <= policyCount; i++) {
            if(policies[i].isActive) activeCount++;
        }
        
        Policy[] memory activePols = new Policy[](activeCount);
        uint256 cursor = 0;
        for(uint i = 1; i <= policyCount; i++) {
            if(policies[i].isActive) {
                activePols[cursor] = policies[i];
                cursor++;
            }
        }
        return activePols;
    }

    function getPatientInsuranceRequests(address _patient) public view returns (InsuranceRequest[] memory) {
        uint256[] memory ids = patientRequests[_patient];
        InsuranceRequest[] memory reqs = new InsuranceRequest[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            reqs[i] = insuranceRequests[ids[i]];
        }
        return reqs;
    }

    function getProviderInsuranceRequests(address _provider) public view returns (InsuranceRequest[] memory) {
        uint256[] memory ids = providerRequests[_provider];
        InsuranceRequest[] memory reqs = new InsuranceRequest[](ids.length);
        for(uint i = 0; i < ids.length; i++) {
            reqs[i] = insuranceRequests[ids[i]];
        }
        return reqs;
    }

    function isInsuranceProvider(address _addr) public view returns (bool) {
        return insuranceProviders[_addr].isActive;
    }
}
