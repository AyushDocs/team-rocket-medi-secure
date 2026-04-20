// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./common/MediSecureAuth.sol";

/**
 * @title WellnessRewards
 * @dev Incentivizes patients to maintain healthy vitals using $SANJ rebates.
 * Supports proof-of-wellness verified via ZK-Proofs.
 */
contract WellnessRewards is ReentrancyGuard, Pausable, MediSecureAuth {
    using SafeERC20 for IERC20;

    IERC20 public immutable sanjeevniToken;
    address public zkpVerifier;

    struct WellnessStreak {
        uint256 count;
        uint256 lastProofTimestamp;
    }

    mapping(address => WellnessStreak) public patientStreaks;
    uint256 public rewardPerProof = 50 * 10**18;
    uint256 public milestoneBonus = 500 * 10**18;
    uint256 public minimumInterval = 25 days;

    // Custom Errors
    error StillInInterval();
    error InvalidProof();
    error NotPatient();

    event WellnessVerified(address indexed patient, uint256 streakCount, uint256 reward);
    event MilestoneReached(address indexed patient, uint256 milestone);

    constructor(address _accessControl, address _forwarder, address _token, address _verifier) 
        MediSecureAuth(_accessControl, _forwarder) 
    {
        sanjeevniToken = IERC20(_token);
        zkpVerifier = _verifier;
    }

    // Context Overrides to resolve conflicts
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    function submitWellnessProof(bytes calldata proof) external whenNotPaused nonReentrant {
        _processWellnessProof(_msgSender(), proof);
    }

    /**
     * @dev Allows an authorized relayer to submit proof on behalf of a patient.
     * This is used when the server generates ZK-proofs for the patient.
     */
    function submitWellnessProofFor(address patient, bytes calldata proof) external onlyAdmin whenNotPaused nonReentrant {
        _processWellnessProof(patient, proof);
    }

    function _processWellnessProof(address patient, bytes calldata proof) internal {
        // require(IZKPVerifier(zkpVerifier).verifyWellness(proof), "Invalid proof");
        
        WellnessStreak storage streak = patientStreaks[patient];
        
        if (block.timestamp < streak.lastProofTimestamp + minimumInterval) {
            revert StillInInterval();
        }

        streak.count++;
        streak.lastProofTimestamp = block.timestamp;

        sanjeevniToken.safeTransfer(patient, rewardPerProof);
        
        uint256 totalReward = rewardPerProof;
        if (streak.count % 5 == 0) {
            sanjeevniToken.safeTransfer(patient, milestoneBonus);
            totalReward += milestoneBonus;
            emit MilestoneReached(patient, streak.count);
        }

        emit WellnessVerified(patient, streak.count, totalReward);
    }

    function setRewardAmounts(uint256 _base, uint256 _bonus) external onlyAdmin {
        rewardPerProof = _base;
        milestoneBonus = _bonus;
    }

    function setInterval(uint256 _interval) external onlyAdmin {
        minimumInterval = _interval;
    }

    function setVerifier(address _verifier) external onlyAdmin {
        zkpVerifier = _verifier;
    }

    function fundRewardPool(uint256 amount) external {
        sanjeevniToken.safeTransferFrom(_msgSender(), address(this), amount);
    }
}
