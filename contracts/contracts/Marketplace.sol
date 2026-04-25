// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./common/MediSecureAuthUpgradeable.sol";
import {Roles} from "./MediSecureAccessControl.sol";

/**
 * @title Marketplace
 * @dev UUPS Upgradeable marketplace for buying and selling medical data.
 */
contract Marketplace is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable, EIP712Upgradeable, UUPSUpgradeable, MediSecureAuthUpgradeable, ERC2771ContextUpgradeable {
    using SafeERC20 for IERC20;

    address public sanjeevniToken;

    bytes32 private constant SELL_DATA_TYPEHASH = keccak256("SellData(uint256 offerId,string ipfsHash,address patient,uint256 nonce)");
    mapping(address => uint256) public nonces;

    uint256 public hourlyLimit;
    uint256 public currentHourlySpent;
    uint256 public lastResetTime;

    // Custom Errors
    error AlreadyRegistered();
    error NotCompany();
    error InvalidBudget();
    error OfferNotActive();
    error InsufficientBudget();
    error NoEarnings();
    error TransferFailed();
    error LimitExceeded();
    error Unauthorized();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address _forwarder) ERC2771ContextUpgradeable(_forwarder) {
        // _disableInitializers();
    }

    function initialize(address _accessControl, address _token) public initializer {
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __EIP712_init("Sanjeevni Marketplace", "1");
        __MediSecureAuth_init(_accessControl);

        sanjeevniToken = _token;
        hourlyLimit = 10 ether;
        lastResetTime = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}

    // Overrides for Context/ERC2771Context to resolve conflicts
    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    function _contextSuffixLength() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (uint256) {
        return ERC2771ContextUpgradeable._contextSuffixLength();
    }

    // --- Data Structures ---
    struct Company {
        uint256 id;
        address wallet;
        string name;
        string email;
        bool isRegistered;
    }

    struct DataOffer {
        uint256 id;
        address company;
        bool isActive;
        bool isToken;
        string title;
        string description;
        uint256 price; 
        uint256 budget; 
    }

    struct PurchasedRecord {
        address patient;
        string ipfsHash;
        uint256 timestamp;
        uint256 offerId;
    }

    mapping(address => Company) public companies;
    mapping(uint256 => DataOffer) public offers;
    mapping(address => PurchasedRecord[]) public companyPurchases;
    mapping(address => mapping(string => bool)) public hasCompanyPurchased;
    mapping(address => uint256[]) public patientParticipations; // Offer IDs patient sold data to
    mapping(address => uint256) public pendingEarnings;
    mapping(address => uint256) public pendingTokenEarnings;

    uint256 public offerCount;
    uint256 public companyCount;

    event CompanyRegistered(address indexed wallet, string name);
    event OfferCreated(uint256 indexed offerId, address indexed company, string title, uint256 price);
    event DataSold(uint256 indexed offerId, address indexed company, address indexed patient, uint256 price, bool isToken);
    event EarningsClaimed(address indexed patient, uint256 amount, bool isToken);

    modifier checkLimit(uint256 _amount) {
        if (block.timestamp > lastResetTime + 1 hours) {
            lastResetTime = block.timestamp;
            currentHourlySpent = 0;
        }
        if (currentHourlySpent + _amount > hourlyLimit) {
            _pause();
            revert LimitExceeded();
        }
        currentHourlySpent += _amount;
        _;
    }

    modifier onlyCompany() {
        if (!accessControl.hasRole(Roles.MARKETPLACE_COMPANY, _msgSender())) revert NotCompany();
        _;
    }

    function registerCompany(string memory _name, string memory _email) public whenNotPaused {
        if (companies[_msgSender()].isRegistered) revert AlreadyRegistered();

        companyCount++;
        companies[_msgSender()] = Company({
            id: companyCount,
            wallet: _msgSender(),
            name: _name,
            email: _email,
            isRegistered: true
        });

        accessControl.grantRole(Roles.MARKETPLACE_COMPANY, _msgSender());
        emit CompanyRegistered(_msgSender(), _name);
    }

    function createOffer(
        string memory _title,
        string memory _description,
        uint256 _pricePerRecord,
        bool _useToken
    ) public payable onlyCompany whenNotPaused {
        if (_useToken) {
            uint256 totalBudget = _pricePerRecord * 10;
            IERC20(sanjeevniToken).safeTransferFrom(_msgSender(), address(this), totalBudget);

            offerCount++;
            offers[offerCount] = DataOffer({
                id: offerCount,
                company: _msgSender(),
                isActive: true,
                isToken: true,
                title: _title,
                description: _description,
                price: _pricePerRecord,
                budget: totalBudget
            });
        } else {
            if (msg.value < _pricePerRecord) revert InvalidBudget();
            offerCount++;
            offers[offerCount] = DataOffer({
                id: offerCount,
                company: _msgSender(),
                isActive: true,
                isToken: false,
                title: _title,
                description: _description,
                price: _pricePerRecord,
                budget: msg.value
            });
        }
        emit OfferCreated(offerCount, _msgSender(), _title, _pricePerRecord);
    }

    function sellData(uint256 _offerId, string memory _ipfsHash) public nonReentrant whenNotPaused {
        _executeDataSale(_offerId, _msgSender(), _ipfsHash);
    }

    function sellDataWithSignature(
        uint256 _offerId,
        string memory _ipfsHash,
        address _patient,
        bytes calldata _signature
    ) external nonReentrant whenNotPaused {
        bytes32 structHash = keccak256(abi.encode(
            SELL_DATA_TYPEHASH,
            _offerId,
            keccak256(bytes(_ipfsHash)),
            _patient,
            nonces[_patient]++
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, _signature);
        require(signer == _patient, "Invalid signature");

        _executeDataSale(_offerId, _patient, _ipfsHash);
    }

    function _executeDataSale(uint256 _offerId, address _patient, string memory _ipfsHash) internal {
        DataOffer storage offer = offers[_offerId];
        if (!offer.isActive) revert OfferNotActive();
        if (offer.budget < offer.price) revert InsufficientBudget();

        offer.budget -= offer.price;
        if (offer.budget < offer.price) offer.isActive = false;

        companyPurchases[offer.company].push(PurchasedRecord({
            patient: _patient,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            offerId: _offerId
        }));
        hasCompanyPurchased[offer.company][_ipfsHash] = true;
        patientParticipations[_patient].push(_offerId);

        if (offer.isToken) {
            pendingTokenEarnings[_patient] += offer.price;
        } else {
            pendingEarnings[_patient] += offer.price;
        }

        emit DataSold(_offerId, offer.company, _patient, offer.price, offer.isToken);
    }

    function claimTokenEarnings() public nonReentrant whenNotPaused {
        uint256 amount = pendingTokenEarnings[_msgSender()];
        if (amount == 0) revert NoEarnings();
        pendingTokenEarnings[_msgSender()] = 0;
        IERC20(sanjeevniToken).safeTransfer(_msgSender(), amount);
        emit EarningsClaimed(_msgSender(), amount, true);
    }

    function claimEarnings() public nonReentrant whenNotPaused checkLimit(pendingEarnings[_msgSender()]) {
        uint256 amount = pendingEarnings[_msgSender()];
        if (amount == 0) revert NoEarnings();
        pendingEarnings[_msgSender()] = 0;

        (bool sent, ) = payable(_msgSender()).call{value: amount}("");
        if (!sent) revert TransferFailed();
        emit EarningsClaimed(_msgSender(), amount, false);
    }

    function getAllOffers() public view returns (DataOffer[] memory) {
        uint256 count = offerCount;
        DataOffer[] memory allOffers = new DataOffer[](count);
        for (uint256 i = 1; i <= count; ) {
            allOffers[i - 1] = offers[i];
            unchecked { i++; }
        }
        return allOffers;
    }

    function getPatientParticipations(address _patient) public view returns (uint256[] memory) {
        return patientParticipations[_patient];
    }

    function getCompanyPurchases(address _company) public view returns (PurchasedRecord[] memory) {
        return companyPurchases[_company];
    }
}
