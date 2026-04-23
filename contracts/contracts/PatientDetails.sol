// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";

/**
 * @title PatientDetails
 * @dev Upgradable contract for storing patient health details.
 * Uses UUPS (Universal Upgradeable Proxy Standard) pattern.
 */
contract PatientDetails is Initializable, UUPSUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable {
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _forwarder) ERC2771ContextUpgradeable(_forwarder) {
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

    // Custom Errors
    error InvalidVitals();
    error AlertAlreadyResolved();

    // Enums
    enum Severity { LOW, MEDIUM, HIGH, CRITICAL }

    struct Vitals {
        string bloodPressure; // e.g., "120/80"
        string weight;        // e.g., "70 kg"
        string height;        // e.g., "175 cm"
        string heartRate;     // e.g., "72 bpm"
        string temperature;   // e.g., "98.6 F"
        uint256 lastUpdated;
    }

    mapping(address => Vitals) private _patientVitals;
    
    struct EmergencyAlert {
        string issue;
        Severity severity;
        uint256 timestamp;
        bool resolved;
    }

    mapping(address => EmergencyAlert[]) private _patientAlerts;

    // Events
    event VitalsUpdated(
        address indexed patient,
        string bloodPressure,
        string weight,
        string height,
        string heartRate,
        string temperature,
        uint256 timestamp
    );

    event VitalsUpdatedByProvider(
        address indexed patient,
        address indexed provider,
        string bloodPressure,
        string heartRate,
        string temperature,
        uint256 timestamp
    );

    event ClinicalAlertTriggered(
        address indexed patient,
        string issue,
        Severity severity,
        uint256 timestamp
    );

    function initialize(address _accessControl) public initializer {
        __MediSecureAuth_init(_accessControl);
        __UUPSUpgradeable_init();
    }

    function setVitals(
        string calldata bp,
        string calldata weight,
        string calldata height,
        string calldata heartRate,
        string calldata temp
    ) external {
        _patientVitals[_msgSender()] = Vitals({
            bloodPressure: bp,
            weight: weight,
            height: height,
            heartRate: heartRate,
            temperature: temp,
            lastUpdated: block.timestamp
        });

        emit VitalsUpdated(
            _msgSender(),
            bp,
            weight,
            height,
            heartRate,
            temp,
            block.timestamp
        );
    }

    function setVitalsForPatient(
        address patient,
        string calldata bp,
        string calldata heartRate,
        string calldata temp
    ) external onlyAdmin() {
        if (patient == address(0)) revert InvalidVitals();
        Vitals storage v = _patientVitals[patient];
        v.bloodPressure = bp;
        v.heartRate = heartRate;
        v.temperature = temp;
        v.lastUpdated = block.timestamp;

        emit VitalsUpdatedByProvider(
            patient,
            _msgSender(),
            bp,
            heartRate,
            temp,
            block.timestamp
        );
    }

    function triggerClinicalAlert(
        address patient,
        string calldata issue,
        Severity severity
    ) external onlyAdmin() {
        _patientAlerts[patient].push(EmergencyAlert({
            issue: issue,
            severity: severity,
            timestamp: block.timestamp,
            resolved: false
        }));

        emit ClinicalAlertTriggered(patient, issue, severity, block.timestamp);
    }

    function getAlerts(address _patient) public view returns (EmergencyAlert[] memory) {
        return _patientAlerts[_patient];
    }

    function getVitals(address patient) external view returns (Vitals memory) {
        return _patientVitals[patient];
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyUpgrader() {}
}
