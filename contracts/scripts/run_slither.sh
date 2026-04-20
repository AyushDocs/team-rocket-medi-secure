#!/bin/bash
# Run Slither static analysis on contracts

echo "Running Slither security analysis..."

# Activate virtual environment
source venv/bin/activate

# Run slither on each contract
for contract in contracts/Doctor.sol \
                 contracts/HandoffManager.sol \
                 contracts/Hospital.sol \
                 contracts/Insurance.sol \
                 contracts/InsuranceVerifier.sol \
                 contracts/Marketplace.sol \
                 contracts/MockInsuranceVerifier.sol \
                 contracts/PatientDetails.sol \
                 contracts/Patient.sol; do
    echo "======================================"
    echo "Analyzing: $contract"
    echo "======================================"
    slither "$contract" \
        --solc-remap '@openzeppelin/contracts=node_modules/@openzeppelin/contracts' \
        --exclude informational \
        2>&1 | grep -E "(Detector:|Reference:|analyzed)"
    echo ""
done

echo "======================================"
echo "Analysis Complete"
echo "======================================"
echo ""
echo "To run with more detailed output:"
echo "  slither contracts/Insurance.sol --solc-remap '@openzeppelin/contracts=node_modules/@openzeppelin/contracts'"