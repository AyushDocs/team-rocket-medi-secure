// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MultiSigWallet.sol";

contract MultiSigWalletFactory {
    mapping(address => address[]) public ownerWallets;
    mapping(address => address) public walletOwners;
    mapping(address => bool) public isWallet;

    event WalletCreated(address indexed wallet, address[] owners, uint256 threshold);

    function createWallet(address[] memory _owners, uint256 _threshold) external returns (address wallet) {
        require(_owners.length <= 10, "Max 10 owners");
        require(_threshold >= 2, "Min threshold 2");
        require(_owners.length >= _threshold, "Threshold > owners");
        
        bytes memory creationCode = type(MultiSigWallet).creationCode;
        bytes memory runtimeCode = type(MultiSigWallet).runtimeCode;
        
        bytes memory args = abi.encode(_owners, _threshold);
        bytes memory initCode = bytes.concat(creationCode, args);
        
        assembly {
            wallet := create(0, add(initCode, 0x20), mload(initCode))
        }
        
        require(wallet != address(0), "Deployment failed");
        
        isWallet[wallet] = true;
        
        for (uint256 i = 0; i < _owners.length; i++) {
            ownerWallets[_owners[i]].push(wallet);
        }
        
        emit WalletCreated(wallet, _owners, _threshold);
    }

    function getWallets(address _owner) external view returns (address[] memory) {
        return ownerWallets[_owner];
    }

    function getWalletCount(address _owner) external view returns (uint256) {
        return ownerWallets[_owner].length;
    }
}