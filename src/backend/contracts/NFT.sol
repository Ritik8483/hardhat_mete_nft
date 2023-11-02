// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFT is ERC721URIStorage {
    uint public tokenCount;

    constructor() ERC721("DApp NFT", "DAPP") {} //It sets up the initial state of the contract. it calls the constructor of the parent contract ERC721 with the arguments "DApp NFT" (the name of the NFT collection) and "DAPP" (the symbol of the NFT collection).

    function mintNft(string memory _tokenURI) external returns (uint) {
        // console.log("_tokenURI : ",_tokenURI);
        // console.log("tokenCount : ",tokenCount);        //initially 0 after minting it becomes 1
        tokenCount++;
        // console.log("ritik",msg.sender);
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        return tokenCount;
    }
}


//_tokenURI :  https://ipfs.io/ipfs/QmQo56X1Xrwn8GjAUy9inr2Bv9uwgnKrhHVKVykqB1w93R
//    tokenCount :  0(Initailly it's 0) when it comes down in function it's incremented and become 1 for first nft
 //   ritik 0x71be63f3384f5fb98995898a86b02fb2426c5788