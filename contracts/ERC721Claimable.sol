// contracts/ERC721MarketPlace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ERC721Claimable is ERC721, Ownable {

    uint256 public premintStartBlock;
    uint256 public premintEndBlock;
    uint256 public maxPremint;
    uint256 public premintPrice;


    uint256 public startMintBlock;
    uint256 public endMintBlock;

    uint256 public startPrice;
    uint256 public endPrice;

    uint256 public reservedAmount;
    uint256 public totalSupply;
    uint256 private nextClaim;
    address public tresory;
    string public baseURI;
    bytes32 public merkleRoot;

    constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    uint256 _premintStartBlock,
    uint256 _premintEndBlock,
    uint256 _maxPremint,
    uint256 _startMintBlock,
    uint256 _endMintBlock,
    uint256 _startPrice,
    uint256 _endPrice,
    uint256 _reservedAmount
    )
        ERC721(_name, _symbol)
    {
        premintStartBlock = _premintStartBlock;
        premintEndBlock = _premintEndBlock;
        maxPremint = _maxPremint;
        startMintBlock = _startMintBlock;
        endMintBlock = _endMintBlock;
        startPrice = _startPrice;
        endPrice = _endPrice;
        reservedAmount = _reservedAmount;
        totalSupply = _totalSupply;
        uint256 supply = 0;
        nextClaim = reservedAmount;
        while(supply < _totalSupply){
            _mint(address(this), supply);
            supply++;
        }
    }


    modifier premintCheck(bytes32[] calldata merkleProof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender)); 
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");
        require(block.number > premintStartBlock, "Too early to premint");
        require(block.number < premintEndBlock, "Too late to premint");
        require(nextClaim < maxPremint, "Too much premint");
        _;
    }

    modifier mintCheck() {
        require(block.number > startMintBlock, "Too early to premint");
        require(block.number < endMintBlock, "Too late to premint");
        _;
    }

    function claimBatch(uint16 numberOfClaims) public mintCheck payable {
        for(uint16 i = 0; i < numberOfClaims; i++){
            claim();
        }
    }

    function claim() public mintCheck payable {
        uint256 mintPrice = startPrice + (((endPrice - startPrice) / (totalSupply - reservedAmount)) * (nextClaim - reservedAmount));
        require(msg.value >= mintPrice, "Price incorrect");
        address payable payableTresory = payable(tresory);
        payableTresory.transfer(msg.value);
        _safeTransfer(address(this), msg.sender, nextClaim, "");
        nextClaim++;
    }

    function preClaim(bytes32[] calldata merkleProof) public premintCheck(merkleProof) payable {
        uint256 mintPrice = premintPrice;
        require(msg.value >= mintPrice, "Price incorrect");
        address payable payableTresory = payable(tresory);
        payableTresory.transfer(mintPrice);
        _safeTransfer(address(this), msg.sender, nextClaim, "");
        nextClaim++;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory newBaseURI) public onlyOwner {
        baseURI = newBaseURI;
    }

    
    function setPremintPrice(uint256 _premintPrice) public onlyOwner {
        premintPrice = _premintPrice;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setTresory(address newTresory) public onlyOwner {
        tresory = newTresory;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        string memory base = _baseURI();
        return string(abi.encodePacked(base, Strings.toString(tokenId), ".json"));
    }

    function claimReserved(uint256 from, uint256 to) public onlyOwner {
        require(to < reservedAmount, "Not reserved");
        for(uint256 i = from; i < to; i++){
            _safeTransfer(address(this), msg.sender, i, "");
        }
    }
}
