// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Hospital {
    struct HospitalDetails {
        uint256 id;
        address walletAddress;
        string name;
        string email;
        string location;
        string registrationNumber;
    }

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

    // Events for Analytics
    event LogPunchIn(address indexed doctor, address indexed hospital, uint256 timestamp);
    event LogPunchOut(address indexed doctor, address indexed hospital, uint256 timestamp, uint256 duration);
    
    event HospitalRegistered(uint256 indexed id, address indexed wallet, string name);
    event DoctorAdded(uint256 indexed hospitalId, address indexed doctor);
    event DoctorRemoved(uint256 indexed hospitalId, address indexed doctor);

    function registerHospital(
        string memory _name,
        string memory _email,
        string memory _location,
        string memory _registrationNumber
    ) public {
        require(walletToHospitalId[msg.sender] == 0, "Hospital already registered");

        hospitalIdCounter++;
        walletToHospitalId[msg.sender] = hospitalIdCounter;

        hospitals[hospitalIdCounter] = HospitalDetails({
            id: hospitalIdCounter,
            walletAddress: msg.sender,
            name: _name,
            email: _email,
            location: _location,
            registrationNumber: _registrationNumber
        });

        emit HospitalRegistered(hospitalIdCounter, msg.sender, _name);
    }

    function addDoctor(address _doctor) public {
        uint256 hospitalId = walletToHospitalId[msg.sender];
        require(hospitalId != 0, "Not a registered hospital");
        require(!isDoctorApproved[hospitalId][_doctor], "Doctor already added");

        hospitalDoctors[hospitalId].push(_doctor);
        isDoctorApproved[hospitalId][_doctor] = true;

        emit DoctorAdded(hospitalId, _doctor);
    }

    function removeDoctor(address _doctor) public {
        uint256 hospitalId = walletToHospitalId[msg.sender];
        require(hospitalId != 0, "Not a registered hospital");
        require(isDoctorApproved[hospitalId][_doctor], "Doctor not in list");

        // Remove from array (swap and pop)
        address[] storage docs = hospitalDoctors[hospitalId];
        for (uint i = 0; i < docs.length; i++) {
            if (docs[i] == _doctor) {
                docs[i] = docs[docs.length - 1];
                docs.pop();
                break;
            }
        }
        
        isDoctorApproved[hospitalId][_doctor] = false;
        
        // Force punch out if on duty?
        if (doctorDutyStatus[msg.sender][_doctor]) {
             doctorDutyStatus[msg.sender][_doctor] = false;
             if (hospitalActiveDoctorCount[msg.sender] > 0) {
                hospitalActiveDoctorCount[msg.sender]--;
             }
             // No log event for forced removal punchout? Or emit one with 0 duration?
             // Let's just reset status.
        }

        emit DoctorRemoved(hospitalId, _doctor);
    }

    // Register for emergency duty at a specific hospital
    function punchIn(address _hospitalAddress) public {
        uint256 hospitalId = walletToHospitalId[_hospitalAddress];
        require(hospitalId != 0, "Invalid hospital address");
        require(isDoctorApproved[hospitalId][msg.sender], "Doctor not approved by this hospital");
        require(!doctorDutyStatus[_hospitalAddress][msg.sender], "Already on duty");

        doctorDutyStatus[_hospitalAddress][msg.sender] = true;
        shiftStartTimes[_hospitalAddress][msg.sender] = block.timestamp;
        hospitalActiveDoctorCount[_hospitalAddress]++;

        emit LogPunchIn(msg.sender, _hospitalAddress, block.timestamp);
    }

    function punchOut(address _hospitalAddress) public {
        require(doctorDutyStatus[_hospitalAddress][msg.sender], "Not on duty");

        uint256 startTime = shiftStartTimes[_hospitalAddress][msg.sender];
        uint256 duration = block.timestamp - startTime;

        doctorDutyStatus[_hospitalAddress][msg.sender] = false;
        shiftStartTimes[_hospitalAddress][msg.sender] = 0;
        
        if (hospitalActiveDoctorCount[_hospitalAddress] > 0) {
            hospitalActiveDoctorCount[_hospitalAddress]--;
        }

        emit LogPunchOut(msg.sender, _hospitalAddress, block.timestamp, duration);
    }

    function isDoctorOnDuty(address _doctor, address _hospitalAddress) public view returns (bool) {
         return doctorDutyStatus[_hospitalAddress][_doctor];
    }
    
    // Getters
    function getHospitalDoctors() public view returns (address[] memory) {
        uint256 hospitalId = walletToHospitalId[msg.sender];
        require(hospitalId != 0, "Not a registered hospital");
        return hospitalDoctors[hospitalId];
    }
    
    function getActiveDoctorCount(address _hospitalAddress) public view returns (uint256) {
        return hospitalActiveDoctorCount[_hospitalAddress];
    }
}
