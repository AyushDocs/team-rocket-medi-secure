// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Roles
 * @dev Role definitions for the MediSecure platform
 */
enum Roles {
    ADMIN,
    DOCTOR,
    PATIENT,
    HOSPITAL,
    INSURANCE_PROVIDER,
    MARKETPLACE_COMPANY,
    VERIFIER,
    UPGRADER,
    GOVERNOR
}

/**
 * @title MediSecureAccessControl
 * @dev Centralized access control contract with role-based permissions
 */
contract MediSecureAccessControl is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant INSURANCE_PROVIDER_ROLE = keccak256("INSURANCE_PROVIDER_ROLE");
    bytes32 public constant MARKETPLACE_COMPANY_ROLE = keccak256("MARKETPLACE_COMPANY_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    // Custom Errors
    error NotAuthorizedManager();

    mapping(address => bool) public authorizedManagers;

    constructor() {
        // Grant deployer admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Maps Roles enum to AccessControl bytes32 hashes
     */
    function getRoleHash(Roles role) public pure returns (bytes32) {
        if (role == Roles.ADMIN) return ADMIN_ROLE;
        if (role == Roles.DOCTOR) return DOCTOR_ROLE;
        if (role == Roles.PATIENT) return PATIENT_ROLE;
        if (role == Roles.HOSPITAL) return HOSPITAL_ROLE;
        if (role == Roles.INSURANCE_PROVIDER) return INSURANCE_PROVIDER_ROLE;
        if (role == Roles.MARKETPLACE_COMPANY) return MARKETPLACE_COMPANY_ROLE;
        if (role == Roles.VERIFIER) return VERIFIER_ROLE;
        if (role == Roles.UPGRADER) return UPGRADER_ROLE;
        if (role == Roles.GOVERNOR) return GOVERNOR_ROLE;
        return 0x00;
    }

    // --- Enum-based Access Control ---

    function hasRole(Roles role, address account) public view returns (bool) {
        return hasRole(getRoleHash(role), account);
    }

    function grantRole(Roles role, address account) public onlyManager {
        _grantRole(getRoleHash(role), account);
    }

    function revokeRole(Roles role, address account) public onlyManager {
        _revokeRole(getRoleHash(role), account);
    }

    modifier onlyManager() {
        if (!(hasRole(ADMIN_ROLE, msg.sender) || authorizedManagers[msg.sender])) revert NotAuthorizedManager();
        _;
    }

    function setAuthorizedManager(address manager, bool status) external onlyRole(getRoleHash(Roles.ADMIN)) {
        authorizedManagers[manager] = status;
    }

    // --- Admin Functions ---

    /**
     * @dev Grant admin role to an address
     * @param account Address to grant role to
     */
    function grantAdminRole(address account) external {
        grantRole(Roles.ADMIN, account);
    }

    /**
     * @dev Grant doctor role to an address
     * @param account Address to grant role to
     */
    function grantDoctorRole(address account) external {
        grantRole(Roles.DOCTOR, account);
    }

    /**
     * @dev Grant patient role to an address
     * @param account Address to grant role to
     */
    function grantPatientRole(address account) external {
        grantRole(Roles.PATIENT, account);
    }

    /**
     * @dev Grant hospital role to an address
     * @param account Address to grant role to
     */
    function grantHospitalRole(address account) external onlyManager() {
        grantRole(Roles.HOSPITAL, account);
    }

    /**
     * @dev Grant insurance provider role to an address
     * @param account Address to grant role to
     */
    function grantInsuranceRole(address account) external onlyManager() {
        grantRole(Roles.INSURANCE_PROVIDER, account);
    }

    /**
     * @dev Grant marketplace company role to an address
     * @param account Address to grant role to
     */
    function grantCompanyRole(address account) external onlyManager() {
        grantRole(Roles.MARKETPLACE_COMPANY, account);
    }

    /**
     * @dev Grant governor role to an address
     */
    function grantGovernorRole(address account) external onlyManager() {
        grantRole(Roles.GOVERNOR, account);
    }

    /**
     * @dev Grant upgrader role to an address
     */
    function grantUpgraderRole(address account) external onlyManager() {
        grantRole(Roles.UPGRADER, account);
    }

    /**
     * @dev Grant verifier role to an address
     */
    function grantVerifierRole(address account) external onlyManager() {
        grantRole(Roles.VERIFIER, account);
    }

    // --- Protocol Control ---

    function pause() external onlyRole(getRoleHash(Roles.ADMIN)) {
        _pause();
    }

    function unpause() external onlyRole(getRoleHash(Roles.ADMIN)) {
        _unpause();
    }

    // --- Check Functions ---

    /**
     * @dev Check if account has doctor role
     * @param account Address to check
     * @return True if account has doctor role
     */
    function isDoctor(address account) external view returns (bool) {
        return hasRole(Roles.DOCTOR, account);
    }

    /**
     * @dev Check if account has patient role
     * @param account Address to check
     * @return True if account has patient role
     */
    function isPatient(address account) external view returns (bool) {
        return hasRole(Roles.PATIENT, account);
    }

    /**
     * @dev Check if account has hospital role
     * @param account Address to check
     * @return True if account has hospital role
     */
    function isHospital(address account) external view returns (bool) {
        return hasRole(Roles.HOSPITAL, account);
    }

    /**
     * @dev Check if account has insurance provider role
     * @param account Address to check
     * @return True if account has insurance provider role
     */
    function isInsuranceProvider(address account) external view returns (bool) {
        return hasRole(Roles.INSURANCE_PROVIDER, account);
    }

    /**
     * @dev Check if account has company role
     * @param account Address to check
     * @return True if account has company role
     */
    function isCompany(address account) external view returns (bool) {
        return hasRole(Roles.MARKETPLACE_COMPANY, account);
    }
}