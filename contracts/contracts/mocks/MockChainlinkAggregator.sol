// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockChainlinkAggregator {
    int256 private _price;
    uint8 public decimals;
    string public description;
    uint256 public version;

    constructor(int256 initialPrice, uint8 _decimals) {
        _price = initialPrice;
        decimals = _decimals;
        description = "Mock ETH/USD";
        version = 1;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (1, _price, block.timestamp, block.timestamp, 1);
    }
    
    function setPrice(int256 newPrice) external {
        _price = newPrice;
    }
}
