// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ConsentSBT
 * @dev Soulbound Token (SBT) representing medical consent. 
 * Non-transferable tokens that doctors hold to prove they have patient permission.
 */
contract ConsentSBT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Mapping from tokenId to patient address who issued it
    mapping(uint256 => address) public tokenIssuers;
    
    // Custom Errors
    error SoulboundRestriction();
    error NotAuthorizedIssuer();

    event ConsentIssued(address indexed patient, address indexed doctor, uint256 tokenId, string uri);
    event ConsentRevoked(address indexed patient, address indexed doctor, uint256 tokenId);

    constructor(address initialOwner) ERC721("Sanjeevni Consent", "S-CONSENT") Ownable(initialOwner) {}

    /**
     * @dev Mint a new consent token to a doctor.
     * Only the authorized Sanjeevni registry/patient contract should call this.
     */
    function mintConsent(address patient, address doctor, string memory uri) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(doctor, tokenId);
        _setTokenURI(tokenId, uri);
        
        tokenIssuers[tokenId] = patient;
        
        emit ConsentIssued(patient, doctor, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Revoke/Burn the consent token.
     * Only the original patient issuer can trigger this.
     */
    function revokeConsent(uint256 tokenId) external {
        address patient = tokenIssuers[tokenId];
        if (msg.sender != patient && msg.sender != owner()) revert NotAuthorizedIssuer();
        
        address doctor = ownerOf(tokenId);
        _burn(tokenId);
        delete tokenIssuers[tokenId];
        
        emit ConsentRevoked(patient, doctor, tokenId);
    }

    /**
     * @dev Override transfer functions to make the token Soulbound (non-transferable).
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting and burning, but revert on any other transfer
        if (from != address(0) && to != address(0)) {
            revert SoulboundRestriction();
        }
        
        return super._update(to, tokenId, auth);
    }

    // Required overrides for ERC721URIStorage
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
