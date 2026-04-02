// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
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
        string title;
        string description;
        uint256 price; // Amount paid to patient per record
        uint256 budget; // Total funds available for this offer
        bool isActive;
    }

    struct PurchasedRecord {
        address patient;
        string ipfsHash;
        uint256 timestamp;
        uint256 offerId;
    }

    // State Variables
    mapping(address => Company) public companies;
    mapping(uint256 => DataOffer) public offers;
    mapping(address => PurchasedRecord[]) public companyPurchases; // company address -> list of records they bought

    uint256 public offerCount = 0;
    uint256 public companyCount = 0;

    // Events
    event CompanyRegistered(address indexed wallet, string name);
    event OfferCreated(
        uint256 indexed offerId,
        address indexed company,
        string title,
        uint256 price
    );
    event DataSold(
        uint256 indexed offerId,
        address indexed company,
        address indexed patient,
        uint256 price
    );

    // --- Modifiers ---
    modifier onlyCompany() {
        require(
            companies[msg.sender].isRegistered,
            "Caller is not a registered company"
        );
        _;
    }

    // --- Company Functions ---

    function registerCompany(string memory _name, string memory _email) public {
        require(
            !companies[msg.sender].isRegistered,
            "Company already registered"
        );

        companyCount++;
        companies[msg.sender] = Company({
            id: companyCount,
            wallet: msg.sender,
            name: _name,
            email: _email,
            isRegistered: true
        });

        emit CompanyRegistered(msg.sender, _name);
    }

    function createOffer(
        string memory _title,
        string memory _description,
        uint256 _pricePerRecord
    ) public payable onlyCompany {
        require(
            msg.value >= _pricePerRecord,
            "Initial budget must cover at least one record"
        );

        offerCount++;
        offers[offerCount] = DataOffer({
            id: offerCount,
            company: msg.sender,
            title: _title,
            description: _description,
            price: _pricePerRecord,
            budget: msg.value,
            isActive: true
        });

        emit OfferCreated(offerCount, msg.sender, _title, _pricePerRecord);
    }

    function fundOffer(uint256 _offerId) public payable onlyCompany {
        require(offers[_offerId].company == msg.sender, "Not your offer");
        offers[_offerId].budget += msg.value;
        offers[_offerId].isActive = true;
    }

    // --- Patient Functions ---

    function sellData(uint256 _offerId, string memory _ipfsHash) public nonReentrant {
        DataOffer storage offer = offers[_offerId];

        require(offer.isActive, "Offer is not active");
        require(offer.budget >= offer.price, "Offer budget exhausted");

        // 1. Update State (Effects)
        offer.budget -= offer.price;

        // Deactivate if empty
        if (offer.budget < offer.price) {
            offer.isActive = false;
        }

        companyPurchases[offer.company].push(
            PurchasedRecord({
                patient: msg.sender,
                ipfsHash: _ipfsHash,
                timestamp: block.timestamp,
                offerId: _offerId
            })
        );

        // 2. Interaction
        (bool sent, ) = payable(msg.sender).call{value: offer.price}("");
        require(sent, "Failed to send Ether to patient");

        emit DataSold(_offerId, offer.company, msg.sender, offer.price);
    }

    // --- Getters ---

    function getAllOffers() public view returns (DataOffer[] memory) {
        DataOffer[] memory allOffers = new DataOffer[](offerCount);
        for (uint i = 1; i <= offerCount; i++) {
            allOffers[i - 1] = offers[i];
        }
        return allOffers;
    }

    function getCompanyPurchases()
        public
        view
        onlyCompany
        returns (PurchasedRecord[] memory)
    {
        return companyPurchases[msg.sender];
    }

    function isCompany(address _addr) public view returns (bool) {
        return companies[_addr].isRegistered;
    }

    function hasPurchased(address _company, string memory _ipfsHash) public view returns (bool) {
        PurchasedRecord[] storage records = companyPurchases[_company];
        for (uint256 i = 0; i < records.length; i++) {
            if (keccak256(abi.encodePacked(records[i].ipfsHash)) == keccak256(abi.encodePacked(_ipfsHash))) {
                return true;
            }
        }
        return false;
    }
}
