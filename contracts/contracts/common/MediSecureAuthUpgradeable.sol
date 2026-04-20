// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../MediSecureAccessControl.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

/**
 * @title MediSecureAuthUpgradeable
 * @dev Base contract for role-based access control pointing to a central registry (Upgradeable)
 */
abstract contract MediSecureAuthUpgradeable is Initializable, ContextUpgradeable {
    MediSecureAccessControl public accessControl;

    function __MediSecureAuth_init(address _accessControl) internal onlyInitializing {
        __Context_init();
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MediSecureAccessControl(_accessControl);
    }

    modifier onlyRoleName(Roles role) {
        require(accessControl.hasRole(role, _msgSender()), "AccessControl: restricted-to-role");
        require(!accessControl.paused(), "MediSecure Protocol: paused");
        _;
    }

    modifier onlyRoleHash(bytes32 roleHash) {
        require(accessControl.hasRole(roleHash, _msgSender()), "AccessControl: restricted-to-role");
        _;
    }

    modifier onlyAdmin() {
        require(accessControl.hasRole(Roles.ADMIN, _msgSender()), "AccessControl: restricted-to-admin");
        _;
    }

    modifier onlyUpgrader() {
        require(accessControl.hasRole(Roles.UPGRADER, _msgSender()), "AccessControl: restricted-to-upgrader");
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

    uint256[49] private __gap;
}
