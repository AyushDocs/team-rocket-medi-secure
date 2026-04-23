// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {StringUtils} from "../libraries/StringUtils.sol";
import {IDoctor, IPatient} from "../interfaces/IInsurance.sol";

library DashboardHelper {
    struct PatientDashboard {
        uint256 patientId;
        string name;
        uint256 recordCount;
        uint256 nomineeCount;
        bool isRegistered;
        string status;
    }

    struct DoctorDashboard {
        uint256 doctorId;
        string name;
        string specialization;
        uint256 patientCount;
        uint256 accessCount;
        bool isRegistered;
        string status;
    }

    struct InsuranceDashboard {
        uint256 totalPolicies;
        uint256 activePolicies;
        uint256 pendingClaims;
        uint256 totalClaims;
    }

    function getPatientStatus(
        address _wallet,
        IPatient _patientContract
    ) internal view returns (PatientDashboard memory) {
        bool exists = _wallet != address(0) &&
            _patientContract.userExists(_wallet);

        if (!exists) {
            return
                PatientDashboard({
                    patientId: 0,
                    name: "",
                    recordCount: 0,
                    nomineeCount: 0,
                    isRegistered: false,
                    status: "NOT_REGISTERED"
                });
        }

        return
            PatientDashboard({
                patientId: 0,
                name: "Patient",
                recordCount: 0,
                nomineeCount: 0,
                isRegistered: true,
                status: "ACTIVE"
            });
    }

    function getDoctorStatus(
        address _wallet,
        IDoctor _doctorContract
    ) internal view returns (DoctorDashboard memory) {
        bool exists = _wallet != address(0) &&
            _doctorContract.doctorExists(_wallet);

        if (!exists) {
            return
                DoctorDashboard({
                    doctorId: 0,
                    name: "",
                    specialization: "",
                    patientCount: 0,
                    accessCount: 0,
                    isRegistered: false,
                    status: "NOT_REGISTERED"
                });
        }

        return
            DoctorDashboard({
                doctorId: 0,
                name: "Doctor",
                specialization: "",
                patientCount: 0,
                accessCount: 0,
                isRegistered: true,
                status: "ACTIVE"
            });
    }
}
