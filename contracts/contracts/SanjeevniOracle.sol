// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./common/MediSecureAuth.sol";

/**
 * @title SanjeevniOracle
 * @dev Custom oracle for medical data validation and reward calculations.
 */
contract SanjeevniOracle is MediSecureAuth {
    
    AggregatorV3Interface internal dataFeed;

    event DataValidated(bytes32 indexed dataHash, bool isValid);

    constructor(address _accessControl, address _trustedForwarder, address _priceFeed) 
        MediSecureAuth(_accessControl, _trustedForwarder) 
    {
        dataFeed = AggregatorV3Interface(_priceFeed);
    }

    /**
     * @dev Returns the latest price from the feed.
     */
    function getLatestDataPoint() public view returns (int) {
        (
            , 
            int data,
            ,
            ,
        ) = dataFeed.latestRoundData();
        return data;
    }

    function validateMedicalData(bytes32 dataHash, bytes memory proof) public onlyAdmin returns (bool) {
        // Logic for off-chain proof verification could be added here
        bool isValid = true; 
        emit DataValidated(dataHash, isValid);
        return isValid;
    }
}