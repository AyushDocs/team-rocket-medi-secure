# Changelog

All notable changes to the MediSecure project will be documented in this file.

## [MVP] - 2026-01-17

### Added
- **Doctor Dashboard**:
    - Modularized into tabs: Overview, Patients, Appointments, Messages, and Documents.
    - **Patient Management**: Ability to add patients by Wallet Address or Patient ID (auto-resolves Address to ID).
    - **Access Requests**: Request access to patient records via IPFS Hash.
    - **Secure Chat**: Real-time messaging with patients using Socket.io.
    - **Document Viewer**: "Documents" tab to view authorized records.

- **Patient Dashboard**:
    - Modularized into tabs: Overview, Records, Chat, Access Requests.
    - **Medical Records**: Upload and store records (IPFS + Smart Contract).
    - **Access Control**: View and Grant access requests from doctors.
    - **Chat**: Communicate with authorized doctors.

- **Secure Document Viewer Component (`SafeDocumentViewer`)**:
    - **Security**: Enforces a "view-only" mode with sandboxed iframe.
    - **Watermarking**: Overlays "CONFIDENTIAL • DO NOT SHARE" on documents.
    - **Verification**: Requires wallet signature to prove identity/authorization before fetching content.
    - **Backend Integration**: Routes file access through a backend proxy (`/files/:hash`) that verifies on-chain access rights before serving content, preventing direct IPFS gateway bypass.

- **Smart Contracts**:
    - `Doctor.sol`: Added `getAccessList` to retrieve all authorized documents for a doctor.
    - `Patient.sol`: Mapping of Wallet Address to Patient ID.

### Fixed
- **Contract Artifact Synchronization**: Updated Truffle migration scripts to manually inject the correct Network ID and Address into the frontend artifacts, resolving "Contract not deployed" errors.
- **Event Listener Mismatch**: Corrected the `AccessRequested` event argument order in the frontend listener to match the Solidity contract (`patient`, `doctor`, `ipfsHash`).
- **Patient Identification**: Standardized the use of `Patient ID` (uint256) for system logic (chat rooms, internal mapping) while allowing `Wallet Address` for user-facing inputs (adding patients).

### Difficulties Faced & Resolutions
1.  **Contract Deployment & Network IDs**:
    *   *Issue*: The frontend `Web3Context` kept failing with "Contract not deployed on this network" because Ganache's Network ID (5777) didn't match the artifacts or changed on restart.
    *   *Resolution*: Modified `1_deploy_patient.js` and `2_deploy_doctor.js` to dynamically fetch the current Network ID and rewrite the JSON artifacts in the `frontend` folder post-migration.

2.  **Event Data Mismatch**:
    *   *Issue*: Patients weren't seeing access requests.
    *   *Resolution*: Debugging revealed that the frontend event listener expected `(doctor, patient...)` while the contract emitted `(patient, doctor...)`. Swapped the arguments in the listener to match the ABI.

3.  **Secure File Access**:
    *   *Issue*: Initially, anyone with the IPFS hash could view the file via public gateways, bypassing the "Grant Access" logic.
    *   *Resolution*: Implemented a backend proxy. The frontend now signs a request, and the backend verifies the signature and checks `doctorContract.hasAccessToDocument` on-chain before streaming the file from IPFS.

4.  **Chat Room ID Consistency**:
    *   *Issue*: Chat rooms were inconsistent because they sometimes used wallet addresses and sometimes IDs.
    *   *Resolution*: Enforced `patientID_doctorID` format for all chat rooms to ensure stable communication channels.
