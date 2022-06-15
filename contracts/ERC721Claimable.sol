// contracts/ERC721MarketPlace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC721Claimable is ERC721, Ownable {
    uint256 public supply = 0;
    uint256 public nextClaim = 0;
    uint256 public claimPrice;
    address public tresory;
    string public baseURI;
    mapping(address => bool) public claimers;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}


    modifier notClaimer {
        require(!claimers[msg.sender], "You already claimed");
        _;
    }

    function claim() public notClaimer payable {
        require(supply > nextClaim, "Nothing to claim");
        require(msg.value == claimPrice, "Price incorrect");
        address payable payableTresory = payable(tresory);
        payableTresory.transfer(claimPrice);
        _safeTransfer(address(this), msg.sender, nextClaim, "");
        nextClaim++;
        claimers[msg.sender] = true;
    }


    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    function setTresory(address newTresory) public onlyOwner {
        tresory = newTresory;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory base = _baseURI();
        return string(abi.encodePacked(base, Strings.toString(tokenId), ".json"));
    }

    function setPrice(uint256 price) public onlyOwner {
        claimPrice = price;
    }

    function mintBatch(uint256 totalSupply) public onlyOwner {
        while(supply < totalSupply){
            _mint(address(this), supply);
            supply++;
        }
    }
}
