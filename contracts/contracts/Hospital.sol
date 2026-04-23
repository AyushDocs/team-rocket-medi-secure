// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./common/MediSecureAuth.sol";
import {Roles} from "./MediSecureAccessControl.sol";



contract Hospital is ReentrancyGuard, MediSecureAuth {
    constructor(address _accessControl, address _trustedForwarder) 
        MediSecureAuth(_accessControl, _trustedForwarder) 
    {}


    struct HospitalDetails {
        uint256 id;
        address walletAddress;
        string name;
        string email;
        string location;
        string registrationNumber;
    }

    // Custom Errors
    error HospitalAlreadyRegistered();
    error NotRegisteredHospital();
    error DoctorAlreadyApproved();
    error DoctorNotApproved();
    error AlreadyOnDuty();
    error NotOnDuty();
    error NoEarningsToClaim();
    error TransferFailed();
    error InvalidDoctorAddress();
    error InvalidHospitalAddress();
    error NoValueSent();

    mapping(address => uint256) public walletToHospitalId;
    mapping(uint256 => HospitalDetails) public hospitals;
    
    // Hospital ID -> List of approved doctor addresses
    mapping(uint256 => address[]) public hospitalDoctors;
    // Helper to check if a doctor is approved by a specific hospital (Hospital ID -> Doctor Address -> Bool)
    mapping(uint256 => mapping(address => bool)) public isDoctorApproved;

    // Hospital Address -> Doctor Address -> Is On Duty
    mapping(address => mapping(address => bool)) public doctorDutyStatus;
    
    // Hospital Address -> Doctor Address -> Shift Start Time
    mapping(address => mapping(address => uint256)) public shiftStartTimes;

    // Hospital Address -> Active Doctor Count
    mapping(address => uint256) public hospitalActiveDoctorCount;

    uint256 private hospitalIdCounter;

    // Hospital address -> Accrued insurance payouts
    mapping(address => uint256) public pendingEarnings;

    // Events for Analytics
    event LogPunchIn(address indexed doctor, address indexed hospital, uint256 timestamp);
    event LogPunchOut(address indexed doctor, address indexed hospital, uint256 timestamp, uint256 duration);
    
    event HospitalRegistered(uint256 indexed id, address indexed wallet, string name);
    event DoctorAdded(uint256 indexed hospitalId, address indexed doctor);
    event DoctorRemoved(uint256 indexed hospitalId, address indexed doctor);
    event SettlementReceived(address indexed hospital, address indexed patient, uint256 amount);
    event EarningsClaimed(address indexed hospital, uint256 amount);

    function registerHospital(
        string memory name,
        string memory email,
        string memory location,
        string memory registrationNumber
    ) public {
        if (walletToHospitalId[_msgSender()] != 0) revert HospitalAlreadyRegistered();

        hospitalIdCounter++;
        walletToHospitalId[_msgSender()] = hospitalIdCounter;

        hospitals[hospitalIdCounter] = HospitalDetails({
            id: hospitalIdCounter,
            walletAddress: _msgSender(),
            name: name,
            email: email,
            location: location,
            registrationNumber: registrationNumber
        });

        emit HospitalRegistered(hospitalIdCounter, _msgSender(), name);

        // Centralize access
        accessControl.grantRole(Roles.HOSPITAL, _msgSender());
    }

    function addDoctor(address doctor) public onlyRoleName(Roles.HOSPITAL) {
        if (doctor == address(0)) revert InvalidDoctorAddress();
        uint256 hospitalId = walletToHospitalId[_msgSender()];
        if (hospitalId == 0) revert NotRegisteredHospital();
        if (isDoctorApproved[hospitalId][doctor]) revert DoctorAlreadyApproved();

        hospitalDoctors[hospitalId].push(doctor);
        isDoctorApproved[hospitalId][doctor] = true;

        emit DoctorAdded(hospitalId, doctor);
    }

    function removeDoctor(address doctor) public onlyRoleName(Roles.HOSPITAL) {
        if (doctor == address(0)) revert InvalidDoctorAddress();
        uint256 hospitalId = walletToHospitalId[_msgSender()];
        if (hospitalId == 0) revert NotRegisteredHospital();
        if (!isDoctorApproved[hospitalId][doctor]) revert DoctorNotApproved();

        // Remove from array (swap and pop)
        address[] storage docs = hospitalDoctors[hospitalId];
        for (uint256 i = 0; i < docs.length; i++) {
            if (docs[i] == doctor) {
                docs[i] = docs[docs.length - 1];
                docs.pop();
                break;
            }
        }
        
        isDoctorApproved[hospitalId][doctor] = false;
        
        // Force punch out if on duty?
        if (doctorDutyStatus[_msgSender()][doctor]) {
             doctorDutyStatus[_msgSender()][doctor] = false;
             if (hospitalActiveDoctorCount[_msgSender()] > 0) {
                hospitalActiveDoctorCount[_msgSender()]--;
             }
             // No log event for forced removal punchout? Or emit one with 0 duration?
             // Let's just reset status.
        }

        emit DoctorRemoved(hospitalId, doctor);
    }

    // Register for emergency duty at a specific hospital
    function punchIn(address hospitalAddress) public onlyRoleName(Roles.DOCTOR) {
        uint256 hospitalId = walletToHospitalId[hospitalAddress];
        if (hospitalId == 0) revert InvalidHospitalAddress();
        if (!isDoctorApproved[hospitalId][_msgSender()]) revert DoctorNotApproved();
        if (doctorDutyStatus[hospitalAddress][_msgSender()]) revert AlreadyOnDuty();

        doctorDutyStatus[hospitalAddress][_msgSender()] = true;
        shiftStartTimes[hospitalAddress][_msgSender()] = block.timestamp;
        hospitalActiveDoctorCount[hospitalAddress]++;

        emit LogPunchIn(_msgSender(), hospitalAddress, block.timestamp);
    }

    function punchOut(address hospitalAddress) public {
        if (!doctorDutyStatus[hospitalAddress][_msgSender()]) revert NotOnDuty();

        uint256 startTime = shiftStartTimes[hospitalAddress][_msgSender()];
        uint256 duration = block.timestamp - startTime;

        doctorDutyStatus[hospitalAddress][_msgSender()] = false;
        shiftStartTimes[hospitalAddress][_msgSender()] = 0;
        
        if (hospitalActiveDoctorCount[hospitalAddress] > 0) {
            hospitalActiveDoctorCount[hospitalAddress]--;
        }

        emit LogPunchOut(_msgSender(), hospitalAddress, block.timestamp, duration);
    }

    function isDoctorOnDuty(address doctor, address hospitalAddress) public view returns (bool) {
         return doctorDutyStatus[hospitalAddress][doctor];
    }
    
    /**
     * @dev Called by authorized Insurance contracts to settle claims directly to the hospital.
     */
    function receiveSettlement(address _hospital, address _patient) external payable {
        if (msg.value == 0) revert NoValueSent();
        if (walletToHospitalId[_hospital] == 0) revert NotRegisteredHospital();
        
        pendingEarnings[_hospital] += msg.value;
        emit SettlementReceived(_hospital, _patient, msg.value);
    }

    /**
     * @dev Allows the hospital administrator to claim accumulated insurance payouts.
     */
    function claimEarnings() public nonReentrant {
        uint256 amount = pendingEarnings[_msgSender()];
        if (amount == 0) revert NoEarningsToClaim();

        pendingEarnings[_msgSender()] = 0;
        
        (bool sent, ) = payable(_msgSender()).call{value: amount}("");
        if (!sent) revert TransferFailed();

        emit EarningsClaimed(_msgSender(), amount);
    }
    
    // Getters
    function getHospitalDoctors() public view returns (address[] memory) {
        uint256 hospitalId = walletToHospitalId[msg.sender];
        if (hospitalId == 0) revert NotRegisteredHospital();
        return hospitalDoctors[hospitalId];
    }
    
    function getActiveDoctorCount(address hospitalAddress) public view returns (uint256) {
        return hospitalActiveDoctorCount[hospitalAddress];
    }
}
