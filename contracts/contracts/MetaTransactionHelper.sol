// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MetaTransactionHelper is EIP712 {
    using ECDSA for bytes32;

    struct MetaTransaction {
        address from;
        address to;
        uint256 value;
        bytes data;
        uint256 nonce;
        uint256 gasPrice;
        uint256 gasLimit;
        uint256 deadline;
    }

string private constant DOMAIN_NAME = "Sanjeevni";
    string private constant DOMAIN_VERSION = "1.0";

    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public executedTx;

    event MetaTransactionExecuted(
        address indexed from,
        address indexed to,
        bytes32 indexed txHash,
        bytes result
    );

    constructor() EIP712(DOMAIN_NAME, DOMAIN_VERSION) {}

    function getTransactionHash(
        address _from,
        address _to,
        uint256 _value,
        bytes calldata _data,
        uint256 _nonce,
        uint256 _gasPrice,
        uint256 _gasLimit,
        uint256 _deadline
    ) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            keccak256("MetaTransaction(address from,address to,uint256 value,bytes data,uint256 nonce,uint256 gasPrice,uint256 gasLimit,uint256 deadline)"),
            _from,
            _to,
            _value,
            keccak256(_data),
            _nonce,
            _gasPrice,
            _gasLimit,
            _deadline
        )));
    }

    function executeMetaTransaction(
        MetaTransaction calldata _tx,
        bytes calldata _signature
    ) external payable returns (bytes memory) {
        require(_tx.deadline >= block.timestamp, "Deadline passed");
        require(_tx.gasPrice * _tx.gasLimit <= msg.value, "Insufficient gas");
        require(nonces[_tx.from] == _tx.nonce, "Invalid nonce");

        bytes32 txHash = getTransactionHash(
            _tx.from,
            _tx.to,
            _tx.value,
            _tx.data,
            _tx.nonce,
            _tx.gasPrice,
            _tx.gasLimit,
            _tx.deadline
        );

        require(!executedTx[txHash], "Already executed");
        executedTx[txHash] = true;

        address signer = txHash.recover(_signature);
        require(signer == _tx.from, "Invalid signer");

        nonces[_tx.from]++;

        (bool success, bytes memory result) = _tx.to.call{value: _tx.value, gas: _tx.gasLimit}(_tx.data);
        require(success, "Tx failed");

        if (_tx.gasPrice * _tx.gasLimit < msg.value) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - _tx.gasPrice * _tx.gasLimit}("");
            require(refundSuccess, "Refund failed");
        }

        emit MetaTransactionExecuted(_tx.from, _tx.to, txHash, result);
        return result;
    }

    function getNonce(address _user) external view returns (uint256) {
        return nonces[_user];
    }

    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}