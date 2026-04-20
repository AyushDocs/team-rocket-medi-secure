// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";

interface IMultiSigWallet {
    function submitTransaction(address _to, uint256 _value, bytes calldata _data) external returns (bytes32);
    function confirmTransaction(bytes32 _txHash) external;
    function executeTransaction(bytes32 _txHash) external;
    function isOwner(address _owner) external view returns (bool);
    function getTransactionCount() external view returns (uint256);
}

/**
 * @title GovernanceManager
 * @dev UUPS Upgradeable governance manager for MediSecure protocol.
 */
contract GovernanceManager is Initializable, UUPSUpgradeable, PausableUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable {
    
    address private _trustedForwarder;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address forwarder) ERC2771ContextUpgradeable(forwarder) {
        _trustedForwarder = forwarder;
        // _disableInitializers();
    }

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

    IMultiSigWallet public multiSigWallet;
    address public timelock;
    
    mapping(bytes32 => bool) public executedProposals;
    mapping(address => bool) public authorizedContracts;
    
    uint256 public proposalThreshold;
    uint256 public proposalCount;
    
    event ProposalCreated(bytes32 indexed proposalHash, address indexed target, string actionType);
    event ProposalExecuted(bytes32 indexed proposalHash);
    event ContractAuthorized(address indexed contract_);
    event ContractDeauthorized(address indexed contract_);
    event MultiSigUpdated(address indexed newMultiSig);

    function initialize(address _multiSig, address _accessControl) public initializer {
        __Pausable_init();
        __MediSecureAuth_init(_accessControl);
        __UUPSUpgradeable_init();
        
        require(_multiSig != address(0), "Invalid multi-sig");
        multiSigWallet = IMultiSigWallet(_multiSig);
        proposalThreshold = 2;
        // GOVERNOR role for multiSig is granted post-deployment by the migration script
        emit MultiSigUpdated(_multiSig);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader() {}

    // Custom Errors
    error NotMultiSigOwner();
    error InvalidAddress();
    error ContractNotAuthorized();
    error AlreadyExecuted();

    modifier onlyMultiSig() {
        if (!multiSigWallet.isOwner(_msgSender())) revert NotMultiSigOwner();
        _;
    }

    function setMultiSig(address _multiSig) external onlyAdmin() {
        if (_multiSig == address(0)) revert InvalidAddress();
        if (!IMultiSigWallet(_multiSig).isOwner(_msgSender())) revert NotMultiSigOwner();
        multiSigWallet = IMultiSigWallet(_multiSig);
        emit MultiSigUpdated(_multiSig);
    }

    function authorizeContract(address _contract) external onlyMultiSig whenNotPaused {
        authorizedContracts[_contract] = true;
        emit ContractAuthorized(_contract);
    }

    function deauthorizeContract(address _contract) external onlyMultiSig whenNotPaused {
        authorizedContracts[_contract] = false;
        emit ContractDeauthorized(_contract);
    }

    function submitUpgradeProposal(address _impl, address _proxy) external onlyRoleName(Roles.GOVERNOR) whenNotPaused {
        if (!authorizedContracts[_proxy]) revert ContractNotAuthorized();
        
        bytes32 proposalHash = keccak256(abi.encode(
            _impl,
            _proxy,
            proposalCount,
            "UPGRADE"
        ));
        
        proposalCount++;
        emit ProposalCreated(proposalHash, _proxy, "UPGRADE");
    }

    function executeProposal(bytes32 _proposalHash) external onlyMultiSig whenNotPaused {
        if (executedProposals[_proposalHash]) revert AlreadyExecuted();
        executedProposals[_proposalHash] = true;
        emit ProposalExecuted(_proposalHash);
    }

    function submitViaMultiSig(address _to, bytes memory _data) external onlyRoleName(Roles.GOVERNOR) returns (bytes32) {
        return multiSigWallet.submitTransaction(_to, 0, _data);
    }

    uint256[50] private __gap;
}