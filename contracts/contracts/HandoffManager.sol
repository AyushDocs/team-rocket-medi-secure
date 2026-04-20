// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./common/MediSecureAuth.sol";
import {Roles} from "./MediSecureAccessControl.sol";

/**
 * @title HandoffManager
 * @dev Manages the legal transfer of clinical responsibility between healthcare providers (Nurses/Doctors).
 */
contract HandoffManager is MediSecureAuth {
    
    struct HandoffSession {
        uint256 id;
        address patient;
        address offGoingNurse;
        address onComingNurse;
        string reportIpfsHash; 
        uint256 startTime;
        uint256 endTime;
        bool isComplete;
        string status; 
    }

    mapping(uint256 => HandoffSession) public handoffs;
    uint256 public handoffCount;

    // Events
    event HandoffInitiated(uint256 indexed id, address indexed patient, address indexed offGoingNurse, string reportIpfsHash);
    event HandoffFinalized(uint256 indexed id, address indexed reliefNurse, uint256 timestamp);

    constructor(address _accessControl, address _forwarder) MediSecureAuth(_accessControl, _forwarder) {}

    function initiateHandoff(address patient, string memory reportIpfsHash) public returns (uint256) {
        handoffCount++;
        handoffs[handoffCount] = HandoffSession({
            id: handoffCount,
            patient: patient,
            offGoingNurse: _msgSender(),
            onComingNurse: address(0),
            reportIpfsHash: reportIpfsHash,
            startTime: block.timestamp,
            endTime: 0,
            isComplete: false,
            status: "PENDING"
        });

        emit HandoffInitiated(handoffCount, patient, _msgSender(), reportIpfsHash);
        return handoffCount;
    }

    function finalizeHandoff(uint256 handoffId) public {
        HandoffSession storage session = handoffs[handoffId];
        require(!session.isComplete, "Handoff already finalized");
        require(session.offGoingNurse != _msgSender(), "Relief nurse cannot be the same as off-going nurse");

        session.onComingNurse = _msgSender();
        session.endTime = block.timestamp;
        session.isComplete = true;
        session.status = "COMPLETED";

        emit HandoffFinalized(handoffId, _msgSender(), block.timestamp);
    }

    function getHandoff(uint256 id) public view returns (HandoffSession memory) {
        return handoffs[id];
    }

    function getPatientHandoffHistory(address patient) public view returns (HandoffSession[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= handoffCount; i++) {
            if (handoffs[i].patient == patient) {
                count++;
            }
        }

        HandoffSession[] memory history = new HandoffSession[](count);
        uint256 cursor = 0;
        for (uint256 i = 1; i <= handoffCount; i++) {
            if (handoffs[i].patient == patient) {
                history[cursor] = handoffs[i];
                cursor++;
            }
        }
        return history;
    }
}
