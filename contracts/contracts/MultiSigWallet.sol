// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MultiSigWallet is ReentrancyGuard {
    address[] public owners;
    mapping(address => bool) public isOwner;
    mapping(address => uint256) public ownerIndex;
    
    uint256 public threshold;
    uint256 public nonce;
    uint256 public chainId;
    bytes32 public domainSeparator;

    mapping(bytes32 => Transaction) public transactions;
    mapping(bytes32 => mapping(address => bool)) public confirmations;
    mapping(bytes32 => uint256) public confirmationCount;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        uint256 nonce;
        bool executed;
    }

    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event TransactionSubmitted(bytes32 indexed txHash, address indexed to, uint256 value);
    event TransactionConfirmed(bytes32 indexed txHash, address indexed owner);
    event TransactionExecuted(bytes32 indexed txHash);
    event ThresholdChanged(uint256 threshold);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(bytes32 _txHash) {
        require(transactions[_txHash].to != address(0), "Tx not found");
        _;
    }

    modifier notExecuted(bytes32 _txHash) {
        require(!transactions[_txHash].executed, "Already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length >= _threshold, "Threshold > owners");
        require(_threshold >= 1, "Threshold < 1");
        
        chainId = block.chainid;
        domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("MultiSigWallet"),
            keccak256("1.0"),
            chainId,
            address(this)
        ));

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Zero address");
            require(!isOwner[_owners[i]], "Duplicate owner");
            
            isOwner[_owners[i]] = true;
            ownerIndex[_owners[i]] = i;
            owners.push(_owners[i]);
            emit OwnerAdded(_owners[i]);
        }
        
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    function submitTransaction(address _to, uint256 _value, bytes calldata _data) external onlyOwner returns (bytes32 txHash) {
        require(_to != address(0), "Zero to");
        
        txHash = keccak256(abi.encode(
            _to,
            _value,
            _data,
            nonce,
            chainId,
            address(this)
        ));
        
        transactions[txHash] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            nonce: nonce,
            executed: false
        });
        
        confirmations[txHash][msg.sender] = true;
        confirmationCount[txHash] = 1;
        
        nonce++;
        
        emit TransactionSubmitted(txHash, _to, _value);
        
        if (confirmationCount[txHash] >= threshold) {
            _executeTransaction(txHash);
        }
    }

    function confirmTransaction(bytes32 _txHash) external onlyOwner txExists(_txHash) notExecuted(_txHash) {
        require(!confirmations[_txHash][msg.sender], "Already confirmed");
        
        confirmations[_txHash][msg.sender] = true;
        confirmationCount[_txHash]++;
        
        emit TransactionConfirmed(_txHash, msg.sender);
        
        if (confirmationCount[_txHash] >= threshold) {
            _executeTransaction(_txHash);
        }
    }

    function executeTransaction(bytes32 _txHash) external onlyOwner txExists(_txHash) notExecuted(_txHash) nonReentrant {
        require(confirmationCount[_txHash] >= threshold, "Not enough confirmations");
        _executeTransaction(_txHash);
    }

    function _executeTransaction(bytes32 txHash_) internal {
        Transaction storage tx_ = transactions[txHash_];
        tx_.executed = true;
        
        (bool success, ) = tx_.to.call{value: tx_.value}(tx_.data);
        require(success, "Execution failed");
        
        emit TransactionExecuted(txHash_);
    }

    function getTransaction(bytes32 _txHash) external view returns (
        address to,
        uint256 value,
        bytes memory data,
        uint256 nonce_,
        bool executed,
        uint256 confirmations_
    ) {
        Transaction storage tx_ = transactions[_txHash];
        return (
            tx_.to,
            tx_.value,
            tx_.data,
            tx_.nonce,
            tx_.executed,
            confirmationCount[_txHash]
        );
    }

    function hasConfirmed(bytes32 _txHash, address _owner) external view returns (bool) {
        return confirmations[_txHash][_owner];
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return nonce;
    }

    receive() external payable {
        emit TransactionSubmitted(bytes32(0), msg.sender, msg.value);
    }
}