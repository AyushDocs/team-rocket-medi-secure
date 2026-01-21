// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/**
 * @title PatientDetails
 * @dev Upgradable contract for storing patient health details.
 * Uses UUPS (Universal Upgradeable Proxy Standard) pattern.
 */
contract PatientDetails is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    struct Vitals {
        string bloodPressure; // e.g., "120/80"
        string weight;        // e.g., "70 kg"
        string height;        // e.g., "175 cm"
        string heartRate;     // e.g., "72 bpm"
        string temperature;   // e.g., "98.6 F"
        uint256 lastUpdated;
    }

    // Mapping from patient address to their health details
    mapping(address => Vitals) private _patientVitals;

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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer function (replaces constructor for upgradable contracts)
     * @param initialOwner Address of the contract owner who can authorized upgrades
     */
    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
    }

    /**
     * @dev Set or update patient health details
     * @param _bp Blood pressure string
     * @param _weight Weight string
     * @param _height Height string
     * @param _heartRate Heart rate string
     * @param _temp Temperature string
     */
    function setVitals(
        string calldata _bp,
        string calldata _weight,
        string calldata _height,
        string calldata _heartRate,
        string calldata _temp
    ) external {
        _patientVitals[msg.sender] = Vitals({
            bloodPressure: _bp,
            weight: _weight,
            height: _height,
            heartRate: _heartRate,
            temperature: _temp,
            lastUpdated: block.timestamp
        });

        emit VitalsUpdated(
            msg.sender,
            _bp,
            _weight,
            _height,
            _heartRate,
            _temp,
            block.timestamp
        );
    }

    /**
     * @dev Get patient health details
     * @param _patient Address of the patient
     * @return Vitals struct containing patient details
     */
    function getVitals(address _patient) external view returns (Vitals memory) {
        return _patientVitals[_patient];
    }

    /**
     * @dev Internal function to authorize contract upgrades.
     * Only the owner can authorize upgrades.
     * @param newImplementation Address of the new implementation contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
