// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SanjeevniToken is ERC20, ERC20Burnable, Pausable, Ownable {
    mapping(address => bool) public minters;
    mapping(address => bool) public blacklisted;
    
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18; // 100M tokens
    uint256 public totalMinted;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event Blacklisted(address indexed account, bool status);
    event TokensMinted(address indexed to, uint256 amount);

    error NotMinter();
    error BlacklistedAccount();
    error ZeroAddress();
    error MaxSupplyExceeded();
    error LengthMismatch();

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert NotMinter();
        _;
    }

    modifier notBlacklisted() {
        if (blacklisted[msg.sender]) revert BlacklistedAccount();
        _;
    }

    constructor() ERC20("Sanjeevni", "SANJ") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 1e18); // 1M to deployer for liquidity
    }

    function mint(address _to, uint256 _amount) external onlyMinter whenNotPaused {
        if (_to == address(0)) revert ZeroAddress();
        if (totalMinted + _amount > MAX_SUPPLY) revert MaxSupplyExceeded();
        
        totalMinted += _amount;
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }

    function batchMint(address[] calldata _recipients, uint256[] calldata _amounts) external onlyMinter whenNotPaused {
        if (_recipients.length != _amounts.length) revert LengthMismatch();
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            if (_recipients[i] == address(0)) revert ZeroAddress();
            if (totalMinted + _amounts[i] > MAX_SUPPLY) revert MaxSupplyExceeded();
            
            totalMinted += _amounts[i];
            _mint(_recipients[i], _amounts[i]);
            emit TokensMinted(_recipients[i], _amounts[i]);
        }
    }

    function addMinter(address _minter) external onlyOwner {
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }

    function removeMinter(address _minter) external onlyOwner {
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }

    function blacklist(address _account, bool _status) external onlyOwner {
        blacklisted[_account] = _status;
        emit Blacklisted(_account, _status);
    }

    function transfer(address _to, uint256 _amount) public override notBlacklisted whenNotPaused returns (bool) {
        return super.transfer(_to, _amount);
    }

    function transferFrom(address _from, address _to, uint256 _amount) public override notBlacklisted whenNotPaused returns (bool) {
        return super.transferFrom(_from, _to, _amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getStats() external view returns (
        uint256 totalSupply_,
        uint256 maxSupply,
        uint256 circulating,
        uint256 minted
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            totalSupply() - balanceOf(owner()),
            totalMinted
        );
    }
}