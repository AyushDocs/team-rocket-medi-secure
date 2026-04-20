// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "../MediSecureAccessControl.sol";

/**
 * @title MediSecureAuth
 * @dev Base contract for role-based access control pointing to a central registry.
 * Supports EIP-2771 Meta-transactions and is Proxy-compatible.
 */
abstract contract MediSecureAuth is ERC2771Context {
    MediSecureAccessControl public accessControl;

    constructor(
        address _accessControl,
        address _trustedForwarder
    ) ERC2771Context(_trustedForwarder) {
        if (_accessControl != address(0)) {
            accessControl = MediSecureAccessControl(_accessControl);
        }
    }

    /**
     * @dev Internal setter for proxies to initialize accessControl.
     */
    function _setAccessControl(address _accessControl) internal {
        if (_accessControl == address(0)) revert("Invalid access control");
        accessControl = MediSecureAccessControl(_accessControl);
    }

    modifier onlyRoleName(Roles role) {
        if (!accessControl.hasRole(role, _msgSender()))
            revert("AccessControl: restricted-to-role");
        if (accessControl.paused()) revert("MediSecure Protocol: paused");
        _;
    }

    modifier onlyRoleHash(bytes32 roleHash) {
        if (!accessControl.hasRole(roleHash, _msgSender()))
            revert("AccessControl: restricted-to-role");
        _;
    }

    modifier onlyAdmin() {
        if (!accessControl.hasRole(Roles.ADMIN, _msgSender()))
            revert("AccessControl: restricted-to-admin");
        _;
    }

    function isAdmin(address account) public view returns (bool) {
        return accessControl.hasRole(Roles.ADMIN, account);
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return accessControl.hasRole(role, account);
    }

    function hasRole(Roles role, address account) public view returns (bool) {
        return accessControl.hasRole(role, account);
    }
}
