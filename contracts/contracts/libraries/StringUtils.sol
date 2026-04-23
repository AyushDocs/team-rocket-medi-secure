// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title StringUtils
 * @author Ayush
 * @notice A library for string manipulation utilities.
 * @dev Provides functions for string comparison, searching, and validation.
 */
library StringUtils {
    /**
     * @notice Compares two strings for equality.
     * @param a The first string to compare.
     * @param b The second string to compare.
     * @return True if the strings are equal, false otherwise.
     */
    function equals(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @notice Checks if a source string contains a search string.
     * @param source The string to search within.
     * @param search The string to search for.
     * @return True if the search string is found in the source string, false otherwise.
     */
    function contains(
        string memory source,
        string memory search
    ) internal pure returns (bool) {
        bytes memory sourceBytes = bytes(source);
        bytes memory searchBytes = bytes(search);
        if (sourceBytes.length < searchBytes.length) return false;

        for (uint256 i = 0; i <= sourceBytes.length - searchBytes.length; i++) {
            bool isMatch = true;
            for (uint256 j = 0; j < searchBytes.length; j++) {
                if (sourceBytes[i + j] != searchBytes[j]) {
                    isMatch = false;
                    break;
                }
            }
            if (isMatch) return true;
        }
        return false;
    }

    function isEmpty(string memory s) internal pure returns (bool) {
        return bytes(s).length == 0;
    }

    function toBytes32(string memory s) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(s));
    }

    /**
     * @notice Converts a bytes32 value to its hex string representation.
     * @param value The bytes32 value to convert.
     * @return The hex string representation of the value.
     */
    function toHexString(bytes32 value) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(value[i] >> 4)];
            str[i * 2 + 1] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }
}
