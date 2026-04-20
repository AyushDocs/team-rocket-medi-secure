// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./common/MediSecureAuth.sol";
import {Roles} from "./MediSecureAccessControl.sol";

/**
 * @title InsurancePriceOracle
 * @dev Fetches real-time price feeds for insurance premium calculation.
 * Links with PriceMedianizer for decentralized trust.
 */
contract InsurancePriceOracle is MediSecureAuth {
    
    mapping(string => address) public priceFeeds;
    address public medianizer;

    event PriceFeedUpdated(string asset, address feed);
    event PriceRequested(string asset, uint256 price);

    constructor(address _accessControl, address _trustedForwarder, address _medianizer) 
        MediSecureAuth(_accessControl, _trustedForwarder) 
    {
        medianizer = _medianizer;
    }

    function setPriceFeed(string memory asset, address feed) public onlyAdmin {
        require(feed != address(0), "Invalid feed");
        priceFeeds[asset] = feed;
        emit PriceFeedUpdated(asset, feed);
    }

    function getLatestPrice(string memory asset) public returns (uint256) {
        address feed = priceFeeds[asset];
        require(feed != address(0), "Feed not found");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");

        emit PriceRequested(asset, uint256(price));
        return uint256(price);
    }
}