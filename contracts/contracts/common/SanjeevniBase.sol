// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

abstract contract SanjeevniBase is Ownable, Pausable {
    mapping(address => bool) public emergencyCallers;

    event EmergencyEnabled(address indexed caller);
    event EmergencyDisabled(address indexed caller);

    modifier onlyEmergency() {
        require(
            emergencyCallers[msg.sender] || msg.sender == owner(),
            "Not emergency"
        );
        _;
    }

    function enableEmergency() external onlyOwner {
        emergencyCallers[msg.sender] = true;
        emit EmergencyEnabled(msg.sender);
    }

    function disableEmergency() external onlyOwner {
        emergencyCallers[msg.sender] = false;
        emit EmergencyDisabled(msg.sender);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
