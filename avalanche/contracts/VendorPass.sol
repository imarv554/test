// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title VendorPass - Non-transferable vendor credential (SBT-like)
contract VendorPass is ERC721, Ownable {
    uint256 public nextId;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address initialOwner) ERC721("Credify Vendor Pass", "CREDIFY-VP") Ownable(initialOwner) {}

    function isVendor(address account) public view returns (bool) {
        return balanceOf(account) > 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    function mint(address to, string memory uri) external onlyOwner returns (uint256 id) {
        id = ++nextId;
        _safeMint(to, id);
        _tokenURIs[id] = uri;
    }

    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        delete _tokenURIs[tokenId];
    }

    // Soulbound behavior: block transfers except mint (from=0) and burn (to=0)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert("SBT: non-transferable");
        return super._update(to, tokenId, auth);
    }
}
