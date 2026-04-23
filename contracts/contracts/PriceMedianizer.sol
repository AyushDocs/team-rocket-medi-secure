// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceMedianizer
 * @dev Aggregates ETH/USD prices from multiple sources (Chainlink, Pyth-style, TWAP)
 * and returns the median to prevent single-oracle manipulation.
 */
contract PriceMedianizer is Ownable {
    
    struct Oracle {
        address addr;
        bool isActive;
        bool isNative; // True for Chainlink-style, False for custom/Pyth-style
    }

    Oracle[] public oracles;
    uint256 public constant MAX_ORACLES = 5;
    uint256 public constant STALE_THRESHOLD = 3600; // 1 hour

    error InsufficientOracles();
    error NoValidPrices();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function addOracle(address _oracle, bool _isNative) external onlyOwner {
        require(oracles.length < MAX_ORACLES, "Max oracles reached");
        oracles.push(Oracle(_oracle, true, _isNative));
    }

    function toggleOracle(uint256 index, bool status) external onlyOwner {
        oracles[index].isActive = status;
    }

    /**
     * @dev Fetches prices from all active oracles and returns the median.
     */
    function getMedianPrice() public view returns (uint256) {
        uint256[] memory prices = new uint256[](oracles.length);
        uint256 validCount = 0;

        for (uint256 i = 0; i < oracles.length; i++) {
            if (!oracles[i].isActive) continue;

            try this.fetchPrice(oracles[i]) returns (uint256 price) {
                if (price > 0) {
                    prices[validCount] = price;
                    validCount++;
                }
            } catch {}
        }

        if (validCount == 0) revert NoValidPrices();

        uint256[] memory validPrices = new uint256[](validCount);
        for(uint256 i = 0; i < validCount; i++) {
            validPrices[i] = prices[i];
        }

        return _computeMedian(validPrices);
    }

    /**
     * @dev Helper to fetch price based on oracle type
     */
    function fetchPrice(Oracle memory oracle) public view returns (uint256) {
        if (oracle.isNative) {
            // Chainlink
            AggregatorV3Interface feed = AggregatorV3Interface(oracle.addr);
            (, int256 price, , uint256 updatedAt, ) = feed.latestRoundData();
            if (block.timestamp - updatedAt > STALE_THRESHOLD) return 0;
            return uint256(price);
        } else {
            // Placeholder for Pyth/Uniswap logic
            // For now, return a custom value or 0
            return 0; 
        }
    }

    /**
     * @dev Simple sorting and median calculation
     */
    function _computeMedian(uint256[] memory data) internal pure returns (uint256) {
        uint256 l = data.length;
        if (l == 0) return 0;
        
        // Sort (Basic Bubble Sort for small array size)
        for (uint256 i = 0; i < l - 1; i++) {
            for (uint256 j = 0; j < l - i - 1; j++) {
                if (data[j] > data[j + 1]) {
                    (data[j], data[j + 1]) = (data[j + 1], data[j]);
                }
            }
        }

        if (l % 2 == 1) {
            return data[l / 2];
        } else {
            return (data[l / 2 - 1] + data[l / 2]) / 2;
        }
    }
}
