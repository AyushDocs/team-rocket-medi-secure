// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library SanityChecks {
    error ZeroAddress();
    error ZeroValue();
    error LengthMismatch();
    error OutOfBounds();

    function requireNonZeroAddress(address _addr) internal pure {
        if (_addr == address(0)) revert ZeroAddress();
    }

    function requireNonZeroValue(uint256 _value) internal pure {
        if (_value == 0) revert ZeroValue();
    }

    function requireEqualLength(uint256 _a, uint256 _b) internal pure {
        if (_a != _b) revert LengthMismatch();
    }

    function requireInBounds(uint256 _index, uint256 _length) internal pure {
        if (_index >= _length) revert OutOfBounds();
    }
}
