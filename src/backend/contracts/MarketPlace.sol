// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Marketplace is ReentrancyGuard {
    // Variables
    address payable public immutable feeAccount; //This is an Ethereum address, specifically a payable address, that will receive fees from transactions on the marketplace.
    uint public immutable feePercent; //An integer representing the percentage of the transaction fees that will go to the feeAccount.
    uint public itemCount; //An integer to keep track of the number of items listed in the marketplace.

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        bool sold;
    }
    // Item[] items;

    mapping(uint => Item) public items; //The mapping is designed for efficient key-value lookups and dynamic growth, while the array is used for ordered collections of elements with indices.
    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );

    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    //a constructor is a special function that gets executed only once, and it's used to initialize the state variables and perform setup when a smart contract is deployed to the Ethereum blockchain
    constructor(uint _feePercent) {
        console.log("_feePercent", _feePercent); //The constructor sets the initial values for feeAccount and feePercent when the contract is deployed.
        feeAccount = payable(msg.sender); // These values determine where the fees from marketplace transactions will be sent.
        feePercent = _feePercent; //by default it's value is 1
    }

    function makeItem(
        //The makeItem function is used to list an NFT item for sale in the marketplace.
        IERC721 _nft, //The ERC721 NFT contract address
        uint _tokenId, //The ID of the NFT within the NFT contract      //sending in binary but recieved here as as 1
        uint _price //The price at which the item is listed in Ether        //we are sending price in binary but recieved here as 2230000000000000000
    ) external nonReentrant {
        require(_price > 0, "Price must be greater than zero");
        itemCount++;
        _nft.transferFrom(msg.sender, address(this), _tokenId); //It transfers ownership of the NFT from the seller to the marketplace contract using
        //It creates an Item struct with the relevant information and stores it in the items mapping.
        items[itemCount] = Item(
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            false
        );
        console.log("itemCount : ", itemCount);
        console.log("msg.sender : ", msg.sender);
        console.log("_tokenId : ", _tokenId);
        console.log("_price : ", _price);
        emit Offered(itemCount, address(_nft), _tokenId, _price, msg.sender); //It emits an Offered event to signal that the item is now available for sale.
    }

    function getTotalPrice(uint _itemId) public view returns (uint) {
        console.log("_itemId : ", _itemId); //sending in _hex but recieved as number
        console.log("feePercent : ", feePercent); //fePercent by default remains 1 only
        console.log("price : ", items[_itemId].price);
        return ((items[_itemId].price * (100 + feePercent)) / 100);
    }

    function purchaseItem(uint _itemId) external payable nonReentrant {
        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        console.log("msgValue", msg.value);
        console.log("_totalPrice", _totalPrice);
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(
            msg.value >= _totalPrice,
            "not enough ether to cover item price and market fee"
        );
        console.log("condition", msg.value >= _totalPrice);
        require(!item.sold, "item already sold");
        item.seller.transfer(item.price);
        console.log("feeAccount", feeAccount);
        feeAccount.transfer(_totalPrice - item.price);      //gas fee transfer to blockchain
        item.sold = true;                                   //status of item after sold
        console.log("purchaser : ",msg.sender);
        console.log("item.tokenId : ",item.tokenId);
        console.log("add:",address(this));
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);         //address(this) = marketplace add ,msg.sender=nft contract address
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function updateNftPrice(uint _itemId, uint newPrice) public {
        Item storage item = items[_itemId];
        console.log("item",_itemId);
        require(newPrice > 0 ether, "Ether too low!");
        item.price = newPrice;
    }

}

// itemCount :  1
//     msg.sender :  0x71be63f3384f5fb98995898a86b02fb2426c5788
//     _tokenId :  1
//     _price :  2100000000000000000

//_itemId :  1
// feePercent :  1
// price :  2100000000000000000


//Purchase

//   console.log:
//     _itemId :  2
//     feePercent :  1
//     price :  2330000000000000000
//     msgValue 2353300000000000000
//     _totalPrice 2353300000000000000
//     condition true
//     feeAccount 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
//     purchaser :  0x976ea74026e726554db657fa54763abd0c3a0aa9
//     item.tokenId :  2
//     add: 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512