#!/bin/bash
# Run Echidna fuzz testing

echo "Running Echidna fuzz tests..."

# Run InsuranceFuzzTest
echo "======================================"
echo "Testing InsuranceFuzzTest"
echo "======================================"
docker run --rm -v $(pwd):/project trailofbits/eth-security-toolbox \
    echidna-test /project/contracts/contracts/InsuranceFuzzTest.sol \
    --config /project/contracts/echidna.config.json \
    --contract InsuranceFuzzTest

# Run DoctorFuzzTest
echo ""
echo "======================================"
echo "Testing DoctorFuzzTest"
echo "======================================"
docker run --rm -v $(pwd):/project trailofbits/eth-security-toolbox \
    echidna-test /project/contracts/contracts/DoctorFuzzTest.sol \
    --config /project/contracts/echidna.config.json \
    --contract DoctorFuzzTest

echo ""
echo "======================================"
echo "Fuzz Testing Complete"
echo "======================================"