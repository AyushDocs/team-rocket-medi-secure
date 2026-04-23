// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IDoctor {
    function doctorExists(address _wallet) external view returns (bool);
    function getDoctorDetails(
        uint256 _doctorId
    )
        external
        view
        returns (
            uint256 doctorId,
            string memory name,
            string memory specialization,
            string memory email,
            uint256[] memory patientIds
        );
}

interface IPatient {
    function userExists(address _wallet) external view returns (bool);
    function getPatientDetails(
        uint256 _patientId
    )
        external
        view
        returns (
            uint256 patientId,
            string memory username,
            string memory name,
            address walletAddress,
            string memory email,
            uint8 age,
            string memory bloodGroup
        );
}

import {IHospital} from "./IHospital.sol";

interface IInsurance {
    function isInsuranceProvider(address _addr) external view returns (bool);
    function getPolicy(
        uint256 _policyId
    )
        external
        view
        returns (
            uint256 id,
            address provider,
            string memory name,
            uint256 basePremium,
            bool isActive
        );
}
