// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract DoctorReputation is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");

    struct Review {
        uint256 id;
        address patient;
        address doctor;
        uint8 rating;
        string comment;
        uint256 appointmentId;
        uint256 timestamp;
        bool isVerifiedVisit;
        bool isDeleted;
    }

    struct DoctorStats {
        uint256 totalReviews;
        uint256 sumRatings;
        uint256 verifiedVisits;
        uint256 totalAppointments;
        uint8 currentRating;
        uint256 reputationScore;
        bool exists;
    }

    struct RatingBreakdown {
        uint256 count5Star;
        uint256 count4Star;
        uint256 count3Star;
        uint256 count2Star;
        uint256 count1Star;
    }

    mapping(address => DoctorStats) public doctorStats;
    mapping(address => uint256[]) public doctorReviewIds;
    mapping(address => mapping(address => bool)) public hasReviewed;
    mapping(uint256 => Review) public reviews;
    mapping(address => mapping(address => uint256)) public lastReviewTime;
    
    uint256 private reviewIdCounter;
    
    uint256 public constant MIN_REVIEW_INTERVAL = 1 hours;
    uint256 public constant MAX_RATING = 5;
    uint256 public constant REPUTATION_WEIGHT_VERIFIED = 150;
    uint256 public constant REPUTATION_WEIGHT_UNVERIFIED = 100;

    event ReviewSubmitted(
        uint256 indexed reviewId,
        address indexed patient,
        address indexed doctor,
        uint8 rating,
        bool verifiedVisit
    );
    event ReviewDeleted(uint256 indexed reviewId);
    event DoctorStatsUpdated(address indexed doctor);
    event ReputationRecalculated(address indexed doctor, uint256 newScore);

    modifier onlyPatient() {
        require(hasRole(PATIENT_ROLE, msg.sender), "Only patients can review");
        _;
    }

    modifier canReview(address _doctor) {
        require(_doctor != msg.sender, "Cannot review yourself");
        require(!hasReviewed[msg.sender][_doctor], "Already reviewed this doctor");
        
        uint256 lastReview = lastReviewTime[msg.sender][_doctor];
        if (lastReview > 0) {
            require(block.timestamp - lastReview >= MIN_REVIEW_INTERVAL, "Review too soon");
        }
        _;
    }

    function submitReview(
        address _doctor,
        uint8 _rating,
        string calldata _comment,
        uint256 _appointmentId,
        bool _verifiedVisit
    ) external onlyPatient canReview(_doctor) nonReentrant whenNotPaused {
        require(_doctor != address(0), "Invalid doctor address");
        require(_rating >= 1 && _rating <= MAX_RATING, "Invalid rating");
        require(doctorStats[_doctor].exists, "Doctor not registered");

        uint256 reviewId = ++reviewIdCounter;
        
        Review storage review = reviews[reviewId];
        review.id = reviewId;
        review.patient = msg.sender;
        review.doctor = _doctor;
        review.rating = _rating;
        review.comment = _comment;
        review.appointmentId = _appointmentId;
        review.timestamp = block.timestamp;
        review.isVerifiedVisit = _verifiedVisit;
        review.isDeleted = false;

        hasReviewed[msg.sender][_doctor] = true;
        lastReviewTime[msg.sender][_doctor] = block.timestamp;
        doctorReviewIds[_doctor].push(reviewId);

        _updateDoctorStats(_doctor);
        
        emit ReviewSubmitted(reviewId, msg.sender, _doctor, _rating, _verifiedVisit);
    }

    function _updateDoctorStats(address _doctor) internal {
        DoctorStats storage stats = doctorStats[_doctor];
        
        uint256[] storage reviewIds = doctorReviewIds[_doctor];
        uint256 totalReviews = 0;
        uint256 sumRatings = 0;
        uint256 verifiedVisits = 0;
        uint256 deletedCount = 0;

        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review storage review = reviews[reviewIds[i]];
            if (review.isDeleted) {
                deletedCount++;
                continue;
            }
            totalReviews++;
            sumRatings += review.rating;
            if (review.isVerifiedVisit) {
                verifiedVisits++;
            }
        }

        stats.totalReviews = totalReviews;
        stats.sumRatings = sumRatings;
        stats.verifiedVisits = verifiedVisits;
        
        if (totalReviews > 0) {
            stats.currentRating = uint8(sumRatings / totalReviews);
        }
        
        stats.reputationScore = _calculateReputationScore(
            stats.currentRating,
            totalReviews,
            verifiedVisits
        );

        emit DoctorStatsUpdated(_doctor);
    }

    function _calculateReputationScore(
        uint8 _rating,
        uint256 _totalReviews,
        uint256 _verifiedVisits
    ) internal pure returns (uint256) {
        if (_totalReviews == 0) return 0;
        
        uint256 baseScore = _rating * 20;
        
        uint256 reviewBonus = _totalReviews > 10 ? (_totalReviews - 10) * 2 : 0;
        reviewBonus = reviewBonus > 100 ? 100 : reviewBonus;
        
        uint256 verifiedBonus = (_verifiedVisits * REPUTATION_WEIGHT_VERIFIED) / 100;
        
        uint256 totalScore = baseScore + reviewBonus + verifiedBonus;
        
        return totalScore > 1000 ? 1000 : totalScore;
    }

    function deleteReview(uint256 _reviewId) external onlyPatient nonReentrant {
        Review storage review = reviews[_reviewId];
        require(review.patient == msg.sender, "Not your review");
        require(!review.isDeleted, "Already deleted");
        
        review.isDeleted = true;
        
        _updateDoctorStats(review.doctor);
        
        emit ReviewDeleted(_reviewId);
    }

    function getDoctorReviews(
        address _doctor,
        uint256 _offset,
        uint256 _limit
    ) external view returns (Review[] memory) {
        uint256[] storage reviewIds = doctorReviewIds[_doctor];
        uint256 totalCount = reviewIds.length;
        
        if (_offset >= totalCount) {
            return new Review[](0);
        }
        
        uint256 resultSize = _offset + _limit > totalCount 
            ? totalCount - _offset 
            : _limit;
        
        Review[] memory result = new Review[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            uint256 idx = reviewIds[_offset + i];
            result[i] = reviews[idx];
        }
        
        return result;
    }

    function getDoctorRatingBreakdown(address _doctor) 
        external 
        view 
        returns (RatingBreakdown memory) 
    {
        uint256[] storage reviewIds = doctorReviewIds[_doctor];
        
        RatingBreakdown memory breakdown;
        
        for (uint256 i = 0; i < reviewIds.length; i++) {
            Review storage review = reviews[reviewIds[i]];
            if (review.isDeleted) continue;
            
            if (review.rating == 5) breakdown.count5Star++;
            else if (review.rating == 4) breakdown.count4Star++;
            else if (review.rating == 3) breakdown.count3Star++;
            else if (review.rating == 2) breakdown.count2Star++;
            else if (review.rating == 1) breakdown.count1Star++;
        }
        
        return breakdown;
    }

    function getDoctorStats(address _doctor) external view returns (DoctorStats memory) {
        return doctorStats[_doctor];
    }

    function getTopDoctors(uint256 _limit) external view returns (address[] memory) {
        uint256 maxDoctors = _limit > 50 ? 50 : _limit;
        address[] memory allDoctors = new address[](maxDoctors);
        uint256 count = 0;
        
        for (uint256 i = 0; i < maxDoctors; i++) {
            if (doctorStats[address(uint160(i))].exists) {
                allDoctors[count++] = address(uint160(i));
            }
        }
        
        for (uint256 i = 0; i < count - 1; i++) {
            for (uint256 j = 0; j < count - i - 1; j++) {
                if (doctorStats[allDoctors[j]].reputationScore < 
                    doctorStats[allDoctors[j + 1]].reputationScore) {
                    address temp = allDoctors[j];
                    allDoctors[j] = allDoctors[j + 1];
                    allDoctors[j + 1] = temp;
                }
            }
        }
        
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = allDoctors[i];
        }
        
        return result;
    }

    function canReviewDoctor(address _doctor) external view returns (bool) {
        if (_doctor == msg.sender) return false;
        if (hasReviewed[msg.sender][_doctor]) return false;
        
        uint256 lastReview = lastReviewTime[msg.sender][_doctor];
        if (lastReview > 0 && block.timestamp - lastReview < MIN_REVIEW_INTERVAL) {
            return false;
        }
        
        return true;
    }

    function registerDoctor(address _doctor) external onlyRole(ADMIN_ROLE) {
        DoctorStats storage stats = doctorStats[_doctor];
        stats.exists = true;
        stats.currentRating = 0;
        stats.reputationScore = 0;
    }

    function pauseContract() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpauseContract() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}