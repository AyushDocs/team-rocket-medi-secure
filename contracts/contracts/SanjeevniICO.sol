// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SanjeevniICO is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public token;
    IERC20 public paymentToken;
    
    uint256 public rate; // tokens per ETH
    uint256 public minPurchase;
    uint256 public maxPurchase;
    uint256 public hardCap;
    uint256 public raised;
    uint256 public startTime;
    uint256 public endTime;
    
    bool public isPaused;
    mapping(address => bool) public whitelisted;
    mapping(address => uint256) public purchasedAmount;
    
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount);
    event RateUpdated(uint256 newRate);
    event WhitelistUpdated(address indexed buyer, bool status);

    constructor(address _token, address _paymentToken) Ownable(msg.sender) {
        require(_token != address(0), "Zero token");
        token = IERC20(_token);
        paymentToken = IERC20(_paymentToken);
        rate = 100; // 100 SANJ per 1 ETH
        minPurchase = 0.01 ether;
        maxPurchase = 10 ether;
        hardCap = 50 ether;
    }

    function setRate(uint256 _rate) external onlyOwner {
        require(_rate > 0, "Rate > 0");
        rate = _rate;
        emit RateUpdated(_rate);
    }

    function setPurchaseLimits(uint256 _min, uint256 _max) external onlyOwner {
        minPurchase = _min;
        maxPurchase = _max;
    }

    function setTime(uint256 _start, uint256 _duration) external onlyOwner {
        startTime = _start;
        endTime = _start + _duration;
    }

    function whitelist(address[] calldata _addresses, bool _status) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelisted[_addresses[i]] = _status;
            emit WhitelistUpdated(_addresses[i], _status);
        }
    }

    function buyTokens(uint256 _amount) external nonReentrant whenNotPaused {
        require(startTime > 0 && block.timestamp >= startTime, "Not started");
        require(endTime > 0 && block.timestamp < endTime, "Ended");
        require(!isPaused, "Paused");
        require(_amount >= minPurchase, "Below min");
        require(_amount <= maxPurchase, "Above max");
        require(raised + _amount <= hardCap, "Hard cap reached");
        
        uint256 tokenAmount = _amount * rate;
        
        paymentToken.safeTransferFrom(msg.sender, address(this), _amount);
        
        purchasedAmount[msg.sender] += _amount;
        raised += _amount;
        
        token.safeTransfer(msg.sender, tokenAmount);
        
        emit TokensPurchased(msg.sender, _amount, tokenAmount);
    }

    function withdrawFunds() external onlyOwner {
        require(block.timestamp > endTime || raised >= hardCap, "ICO active");
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.safeTransfer(owner(), balance);
    }

    function pauseICO() external onlyOwner {
        isPaused = true;
    }

    function unpauseICO() external onlyOwner {
        isPaused = false;
    }

    modifier whenNotPaused() {
        require(!isPaused, "Paused");
        _;
    }

    function getStats() external view returns (
        uint256 rate_,
        uint256 raised_,
        uint256 hardCap_,
        uint256 tokensSold,
        bool active
    ) {
        return (
            rate,
            raised,
            hardCap,
            raised * rate,
            block.timestamp >= startTime && block.timestamp < endTime && raised < hardCap
        );
    }
}