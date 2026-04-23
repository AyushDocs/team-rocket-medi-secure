// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IHospital
 * @dev Interface for hospital contract interactions.
 * @notice Defines the functions that hospital contracts must implement for interoperability.
 */
interface IHospital {
    /**
     * @dev Gets the hospital ID associated with a wallet address.
     * @param wallet The wallet address to query.
     * @return The hospital ID.
     */
    function walletToHospitalId(address wallet) external view returns (uint256);

    /**
     * @dev Checks if a doctor is approved by the hospital.
     * @param hospitalId The hospital's unique ID.
     * @param doctor The doctor's wallet address.
     * @return True if the doctor is approved, false otherwise.
     */
    function isDoctorApproved(
        uint256 hospitalId,
        address doctor
    ) external view returns (bool);
    function isDoctorOnDuty(
        address doctor,
        address hospitalAddress
    ) external view returns (bool);

    function receiveSettlement(address _hospital, address _patient) external payable;
}
