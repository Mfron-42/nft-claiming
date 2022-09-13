// contracts/ERC721MarketPlace.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ERC721Claimable is ERC721, Ownable {
    uint16 constant maxPremint = 15;
    uint16  constant maxMint = 40;

    uint256 public freeAmount;


    uint256 public premintPrice;

    uint256 public startMintTimestamp;
    uint256 public startPremintTimestamp;
    uint256 public endPremintTimestamp;

    uint256 public startPrice;
    uint256 public endPrice;

    uint256 public reservedAmount;
    uint256 public totalSupply;
    uint256 public nextClaim;
    address public tresory;
    string public baseURI;
    bytes32 public merkleRoot;
    mapping (address=>uint256) public premintCount;
    mapping (address=>uint256) public mintCount;

    constructor(
    string memory _name,
    string memory _symbol,
    uint256 _totalSupply,
    uint256 _freeAmount,
    uint256 _premintPrice,
    uint256 _startPremintTimestamp,
    uint256 _startMintTimestamp,
    uint256 _startPrice,
    uint256 _endPrice,
    uint256 _reservedAmount
    )
        ERC721(_name, _symbol)
    {
        totalSupply = _totalSupply;
        freeAmount = _freeAmount;
        premintPrice = _premintPrice;
        startPremintTimestamp = _startPremintTimestamp;
        startMintTimestamp = _startMintTimestamp;
        startPrice = _startPrice;
        endPrice = _endPrice;
        reservedAmount = _reservedAmount;
        nextClaim = reservedAmount;
        endPremintTimestamp = startMintTimestamp;
    }


    modifier premintCheck(uint256 amount, bytes32[] calldata merkleProof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(nextClaim + amount < totalSupply, "Collection overflow");
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");
        require(premintCount[msg.sender] + amount <= maxPremint, "Too much premint");
        require(block.timestamp > startPremintTimestamp, "Too early to premint");
        require(block.timestamp < endPremintTimestamp, "Too late to premint");
        _;
    }

    modifier mintCheck(uint256 amount) {
        require(nextClaim + amount < totalSupply, "Collection overflow");
        require(block.timestamp > startMintTimestamp, "Too early to mint");
        require(mintCount[msg.sender] + amount <= maxMint, "Too much mint");
        _;
    }

    function getPrices(uint256 fromId, uint256 amount) public view  returns (uint256 prices){
        for (uint256 i = 0; i < amount; i++){
            prices += getPrice(fromId +  i);
        }
        return prices;
    }

    function getPrice(uint256 tokenId) public view  returns (uint256){
        if (tokenId < (reservedAmount + freeAmount))
            return 0;
        return startPrice + (((endPrice - startPrice) / (totalSupply - reservedAmount)) * (tokenId - reservedAmount));
    }

    function mint(uint256 amount) public mintCheck(amount) payable {
        uint256 prices = getPrices(nextClaim, amount);
        require(msg.value >= prices, "Price incorrect");
        for (uint256 i = 0; i < amount; i++){
            _mint(msg.sender, nextClaim + i);
        }
        address payable payableTresory = payable(tresory);
        mintCount[msg.sender] += amount;
        nextClaim += amount;
        payableTresory.transfer(msg.value);
    }

    function preMint(uint256 amount, bytes32[] calldata merkleProof) public premintCheck(amount, merkleProof) payable {
        uint256 prices = amount * premintPrice;
        require(msg.value >= prices, "Price incorrect");
        for (uint256 i = 0; i < amount; i++){
            _mint(msg.sender, nextClaim + i);
        }
        address payable payableTresory = payable(tresory);
        premintCount[msg.sender] += amount;
        nextClaim += amount;
        payableTresory.transfer(msg.value);
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
        return string(abi.encodePacked(base, Strings.toString(tokenId)));
    }

    function claimReserved(uint256 from, uint256 amount) public onlyOwner {
        require(from + amount <= reservedAmount, "Not reserved");
        for(uint256 i = 0; i < amount; i++){
            _mint(msg.sender, from + i);
        }
    }
}
