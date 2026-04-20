// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/**
 * @title SanjeevniMockForwarder
 * @dev Mock trusted forwarder for development/testing gasless transactions locally.
 */
contract SanjeevniMockForwarder is ERC2771Forwarder {
    constructor() ERC2771Forwarder("SanjeevniMockForwarder") {}
}
