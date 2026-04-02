// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HandoffManager
 * @dev Manages the legal transfer of clinical responsibility between healthcare providers (Nurses/Doctors).
 * Securely logs shift-end handoffs on-chain to provide an immutable clinical audit trail.
 */
contract HandoffManager is Ownable {
    
    struct HandoffSession {
        uint256 id;
        address patient;
        address offGoingNurse;
        address onComingNurse;
        string reportIpfsHash; // The clinical report on IPFS
        uint256 startTime;
        uint256 endTime;
        bool isComplete;
        string status; // PENDING, COMPLETED, DISPUTED
    }

    mapping(uint256 => HandoffSession) public handoffs;
    uint256 public handoffCount;

    // Events
    event HandoffInitiated(uint256 indexed id, address indexed patient, address indexed offGoingNurse, string reportIpfsHash);
    event HandoffFinalized(uint256 indexed id, address indexed reliefNurse, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Step 1: Off-going nurse initiates the clinical transfer
     */
    function initiateHandoff(address _patient, string memory _reportIpfsHash) public returns (uint256) {
        handoffCount++;
        handoffs[handoffCount] = HandoffSession({
            id: handoffCount,
            patient: _patient,
            offGoingNurse: msg.sender,
            onComingNurse: address(0),
            reportIpfsHash: _reportIpfsHash,
            startTime: block.timestamp,
            endTime: 0,
            isComplete: false,
            status: "PENDING"
        });

        emit HandoffInitiated(handoffCount, _patient, msg.sender, _reportIpfsHash);
        return handoffCount;
    }

    /**
     * @dev Step 2: Relief nurse verifies the handoff and takes responsibility
     */
    function finalizeHandoff(uint256 _handoffId) public {
        HandoffSession storage session = handoffs[_handoffId];
        require(!session.isComplete, "Handoff already finalized");
        require(session.offGoingNurse != msg.sender, "Relief nurse cannot be the same as off-going nurse");

        session.onComingNurse = msg.sender;
        session.endTime = block.timestamp;
        session.isComplete = true;
        session.status = "COMPLETED";

        emit HandoffFinalized(_handoffId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get details of a handoff session
     */
    function getHandoff(uint256 _id) public view returns (HandoffSession memory) {
        return handoffs[_id];
    }

    /**
     * @dev Get all handoffs for a specific patient
     */
    function getPatientHandoffHistory(address _patient) public view returns (HandoffSession[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= handoffCount; i++) {
            if (handoffs[i].patient == _patient) {
                count++;
            }
        }

        HandoffSession[] memory history = new HandoffSession[](count);
        uint256 cursor = 0;
        for (uint256 i = 1; i <= handoffCount; i++) {
            if (handoffs[i].patient == _patient) {
                history[cursor] = handoffs[i];
                cursor++;
            }
        }
        return history;
    }
}
