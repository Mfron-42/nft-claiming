import { BigNumber, BigNumberish } from "ethers";
import { formatEther, keccak256, parseEther } from "ethers/lib/utils";
import { ethers, hardhatArguments } from "hardhat";
import { ERC721Claimable } from "../../typechain-types/ERC721Claimable";
import * as readline  from "readline";
import { MerkleTree } from "merkletreejs";
import hre from "hardhat";


export async function deploy(
  collectionName : string,
  collectionSymbol: string,
  collectionSize : number,
  ipfsFolder: string,
  tresory: string,
  premintStartBlock: number,
  premintEndBlock: number,
  premintPrice: BigNumber,
  maxPremint: number,
  startMintBlock: number,
  endMintBlock: number,
  startPrice: BigNumber,
  endPrice: BigNumber,
  reservedAmount: number,
  merkleRoot: Buffer)  {
    const [deployer] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("ERC721Claimable");
    const constructorArguments = [collectionName,
      collectionSymbol,
      collectionSize,
      premintStartBlock,
      premintEndBlock,
      maxPremint,
      startMintBlock,
      endMintBlock,
      startPrice,
      endPrice,
      reservedAmount] as const;
    console.log("Deploying contracts with the account:", deployer.address);
    const collection = await contractFactory.deploy(...constructorArguments);
    await collection.deployed();
    console.log("contract deployed address:", collection.address);


    await ((await collection.setMerkleRoot(merkleRoot)).wait());
    console.log("Whitelist ready");

    await ((await collection.claimReserved(0, reservedAmount - 1)).wait());
    console.log("Claimed all reserved nfts");
    
  
    await ((await collection.setPremintPrice(premintPrice)).wait());
    console.log("Set premint price to " + premintPrice);

    await ((await collection.setBaseURI("ipfs://" + ipfsFolder + "/")).wait());
    console.log("Set folder to " + ipfsFolder);
    
    const nfturi = await collection.tokenURI(0);
    console.log("First nft uri verify the json please : " + nfturi);


        await ((await collection.claim({
      value: parseEther("1")
    })).wait());
    console.log("claimed");

    return {
      contractAddress : collection.address,
      constructorArguments
    };
}

async function main() {
    // let rl = readline.createInterface({
    //     input: process.stdin,
    //     output: process.stdout
    //   });
      // const collectionName : string = await new Promise(resolve => {
      //   rl.question("Collection name ?\n", resolve)
      // })
      // const collectionSymbol : string = await new Promise(resolve => {
      //   rl.question("Collection symbol ?\n", resolve)
      // })
      // const collectionSize : string = await new Promise(resolve => {
      //   rl.question("Collection size ?\n", resolve)
      // })
      // const ipfsFolder : string = await new Promise(resolve => {
      //   rl.question("ipfs folder ?\n", resolve)
      // })
      // const tresory : string = await new Promise(resolve => {
      //   rl.question("tresory address ?\n", resolve)
      // })
      // const premintStartBlock : string = await new Promise(resolve => {
      //   rl.question("Premint start block ?\n", resolve)
      // })
      // const premintEndBlock : string = await new Promise(resolve => {
      //   rl.question("Premint end block ?\n", resolve)
      // })
      // const premintPrice : string = await new Promise(resolve => {
      //   rl.question("Premint price (eth) ?\n", resolve)
      // })
      // const maxPremint : string = await new Promise(resolve => {
      //   rl.question("Maximum of premint ?\n", resolve)
      // })
      // const startMintBlock : string = await new Promise(resolve => {
      //   rl.question("Start mint block ?\n", resolve)
      // })
      // const endMintBlock : string = await new Promise(resolve => {
      //   rl.question("End mint block ?\n", resolve)
      // })
      // const startPrice : string = await new Promise(resolve => {
      //   rl.question("Price of the first item (eth) ?\n", resolve)
      // })
      // const endPrice : string = await new Promise(resolve => {
      //   rl.question("Price of the last item (eth) ?\n", resolve)
      // })
      // const reservedAmount : string = await new Promise(resolve => {
      //   rl.question("Reserved amount ?\n", resolve)
      // })
      // const whiteListedAddressesInput : string = await new Promise(resolve => {
      //   rl.question("Whitelist (ex : 0x...,0x...,0x...) ?\n", resolve)
      // }) 


      const [deployer] = await ethers.getSigners();

      const collectionName : string = "abc";
      const collectionSymbol : string = "ab";
      const collectionSize : string = "50";
      const ipfsFolder : string = "nofolder";
      const tresory : string = "0x14f2cC32d1E48E65983E3944204534b45c9971FB";
      const premintStartBlock : string = "0";
      const premintEndBlock : string = "999999999";
      const premintPrice : string = "0.1";
      const maxPremint : string = "20";
      const startMintBlock : string = "0";
      const endMintBlock : string = "999999999";
      const startPrice : string = "0.1";
      const endPrice : string = "2";
      const reservedAmount : string = "10"; 
      const whiteListedAddressesInput : string = "0x14f2cC32d1E48E65983E3944204534b45c9971FB,0x14f2cC32d1E48E65983E3944204534b45c9971FB";


      const whiteListedAddresses = whiteListedAddressesInput.split(",");
      const leafNodes = whiteListedAddresses.map(add => keccak256(add));
      console.log("Whitelisted addresses : ", whiteListedAddresses)
      const merkleTree = new MerkleTree(leafNodes, keccak256, {sortPairs : true});
      console.log("Proof : ", merkleTree.getHexProof(keccak256("0x14f2cC32d1E48E65983E3944204534b45c9971FB")));
      // return;
    const result = await deploy(
       collectionName,
       collectionSymbol,
       +collectionSize,
       ipfsFolder,
       tresory,
       +premintStartBlock,
       +premintEndBlock,
       parseEther(premintPrice),
       +maxPremint,
       +startMintBlock,
       +endMintBlock,
       parseEther(startPrice),
       parseEther(endPrice),
       +reservedAmount,
       merkleTree.getRoot());
    console.log("Nft contract deployed : " + result.contractAddress);
    await hre.run("verify:verify", {
      address: result.contractAddress,
      constructorArguments: result.constructorArguments
    });
    console.log("Contract verified");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });