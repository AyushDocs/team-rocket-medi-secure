// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

abstract contract SanjeevniAuth is Ownable, ERC2771Context {
    mapping(address => bool) public authorizedCallers;
    mapping(address => uint256) public lastAccessTime;
    uint256 public accessTimeout = 1 hours;

    event AccessRevoked(address indexed caller);
    event AccessGranted(address indexed caller);

    constructor(address _forwarder) 
        Ownable(_msgSender()) 
        ERC2771Context(_forwarder) 
    {}

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    error NotAuthorized();
    error AccessExpired();

    modifier onlyAuthorized() {
        if (!authorizedCallers[_msgSender()] && _msgSender() != owner()) revert NotAuthorized();
        _;
    }

    modifier withinTimeout() {
        if (block.timestamp - lastAccessTime[_msgSender()] > accessTimeout) revert AccessExpired();
        _;
    }

    function grantAccess(address _caller) external onlyOwner {
        authorizedCallers[_caller] = true;
        lastAccessTime[_caller] = block.timestamp;
        emit AccessGranted(_caller);
    }

    function revokeAccess(address _caller) external onlyOwner {
        authorizedCallers[_caller] = false;
        emit AccessRevoked(_caller);
    }

    function updateAccessTimeout(uint256 _timeout) external onlyOwner {
        accessTimeout = _timeout;
    }

    function refreshAccess() external {
        lastAccessTime[_msgSender()] = block.timestamp;
    }
}
