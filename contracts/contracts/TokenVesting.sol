// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @title TokenVesting
 * @dev Manages token release schedules for team and investors. Now supports EIP-2771 Gasless claims.
 */
contract TokenVesting is Ownable, ERC2771Context {
    using SafeERC20 for IERC20;

    // Custom Errors
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDuration();
    error NoTokensToRelease();
    error NotRevocable();
    error AlreadyRevoked();
    error Unauthorized();

    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 duration;
        uint256 released;
        bool revocable;
        bool revoked;
    }

    IERC20 public immutable token;
    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => bytes32[]) public beneficiarySchedules;
    
    uint256 public totalVested;
    
    event VestingCreated(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event TokensReleased(bytes32 indexed scheduleId, uint256 amount);
    event VestingRevoked(bytes32 indexed scheduleId);

    constructor(address _token, address _trustedForwarder) 
        Ownable(_msgSender()) 
        ERC2771Context(_trustedForwarder) 
    {
        if (_token == address(0)) revert InvalidAddress();
        token = IERC20(_token);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    function createVesting(
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _cliffDuration,
        uint256 _duration,
        bool _revocable
    ) external onlyOwner returns (bytes32 scheduleId) {
        if (_beneficiary == address(0)) revert InvalidAddress();
        if (_totalAmount == 0) revert InvalidAmount();
        if (_duration == 0) revert InvalidDuration();
        
        scheduleId = keccak256(abi.encodePacked(_beneficiary, _totalAmount, block.timestamp));
        
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _totalAmount,
            startTime: block.timestamp,
            cliffDuration: _cliffDuration,
            duration: _duration,
            released: 0,
            revocable: _revocable,
            revoked: false
        });
        
        beneficiarySchedules[_beneficiary].push(scheduleId);
        totalVested += _totalAmount;
        
        token.safeTransferFrom(_msgSender(), address(this), _totalAmount);
        emit VestingCreated(scheduleId, _beneficiary, _totalAmount);
    }

    /**
     * @dev Allows beneficiaries to claim their vested tokens. Supports gasless relayers.
     */
    function claim() external returns (uint256 releasedAmount) {
        address sender = _msgSender();
        bytes32[] storage scheduleIds = beneficiarySchedules[sender];
        uint256 totalRelease;
        
        for (uint256 i = 0; i < scheduleIds.length; ++i) {
            VestingSchedule storage schedule = vestingSchedules[scheduleIds[i]];
            if (schedule.revoked) continue;
            
            uint256 vestedAmount = calculateVestedAmount(schedule);
            if (vestedAmount > schedule.released) {
                uint256 releasable = vestedAmount - schedule.released;
                schedule.released += releasable;
                totalRelease += releasable;
                emit TokensReleased(scheduleIds[i], releasable);
            }
        }
        
        if (totalRelease == 0) revert NoTokensToRelease();
        token.safeTransfer(sender, totalRelease);
        return totalRelease;
    }

    function calculateVestedAmount(VestingSchedule storage _schedule) internal view returns (uint256) {
        if (block.timestamp < _schedule.startTime + _schedule.cliffDuration) {
            return 0;
        }
        if (block.timestamp >= _schedule.startTime + _schedule.duration) {
            return _schedule.totalAmount;
        }
        return (_schedule.totalAmount * (block.timestamp - _schedule.startTime)) / _schedule.duration;
    }

    function getReleasableAmount(address _beneficiary) external view returns (uint256) {
        bytes32[] storage scheduleIds = beneficiarySchedules[_beneficiary];
        uint256 totalRelease;
        
        for (uint256 i = 0; i < scheduleIds.length; ++i) {
            VestingSchedule storage schedule = vestingSchedules[scheduleIds[i]];
            if (schedule.revoked) continue;
            
            uint256 vestedAmount = calculateVestedAmount(schedule);
            if (vestedAmount > schedule.released) {
                totalRelease += vestedAmount - schedule.released;
            }
        }
        return totalRelease;
    }

    function revokeVesting(bytes32 _scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        if (!schedule.revocable) revert NotRevocable();
        if (schedule.revoked) revert AlreadyRevoked();
        
        schedule.revoked = true;
        uint256 remaining = schedule.totalAmount - schedule.released;
        totalVested -= remaining;
        
        if (remaining > 0) {
            token.safeTransfer(owner(), remaining);
        }
        
        emit VestingRevoked(_scheduleId);
    }

    function getBeneficiarySchedules(address _beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[_beneficiary];
    }

    function getScheduleDetails(bytes32 _scheduleId) external view returns (
        address beneficiary,
        uint256 totalAmount,
        uint256 released,
        uint256 releasable,
        bool revocable,
        bool revoked
    ) {
        VestingSchedule storage schedule = vestingSchedules[_scheduleId];
        return (
            schedule.beneficiary,
            schedule.totalAmount,
            schedule.released,
            calculateVestedAmount(schedule) - schedule.released,
            schedule.revocable,
            schedule.revoked
        );
    }
}