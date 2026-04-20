// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title SanjeevniTimelock
 * @dev 48-hour Timelock for protocol governance.
 * This contract will be the ADMIN of MediSecureAccessControl.
 * Any admin action (like upgrading PatientDetails or pausing the protocol) 
 * will require a 48-hour delay, giving users time to react.
 */
contract SanjeevniTimelock is TimelockController {
    /**
     * @param minDelay The minimum time (in seconds) that must pass before a transaction can be executed.
     * @param proposers List of addresses allowed to propose transactions (e.g., core devs/DAO).
     * @param executors List of addresses allowed to execute transactions (usually includes zero address for public execution).
     * @param admin The address that can grant/revoke roles within the timelock itself (should be transitioned to the timelock itself later).
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
