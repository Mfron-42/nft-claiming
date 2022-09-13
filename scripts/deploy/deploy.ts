import { BigNumber } from "ethers";
import { keccak256, parseEther } from "ethers/lib/utils";
import { ethers, } from "hardhat";
import * as readline from "readline";
import { MerkleTree } from "merkletreejs";
import hre from "hardhat";


export async function deploy(
  collectionName: string,
  collectionSymbol: string,
  collectionSize: number,
  ipfsFolder: string,
  tresory: string,
  freeAmount: number,
  premintPrice: BigNumber,
  startPremintTimestamp: number,
  startMintTimestamp: number,
  startPrice: BigNumber,
  endPrice: BigNumber,
  reservedAmount: number,
  merkleRoot: Buffer) {
  const [deployer] = await ethers.getSigners();
  const contractFactory = await ethers.getContractFactory("ERC721Claimable");
  const constructorArguments = [collectionName,
    collectionSymbol,
    collectionSize,
    freeAmount,
    premintPrice,
    startPremintTimestamp,
    startMintTimestamp,
    startPrice,
    endPrice,
    reservedAmount] as const;
  console.log("Deploying contracts with the account:", deployer.address);
  const collection = await contractFactory.deploy(...constructorArguments);
  await collection.deployed();
  console.log("contract deployed address:", collection.address);

  await ((await collection.setTresory(tresory)).wait());
  console.log("Tresory set to " + tresory);

  await ((await collection.setMerkleRoot(merkleRoot)).wait());
  console.log("Whitelist ready");

  await ((await collection.claimReserved(0, reservedAmount)).wait());
  console.log("Claimed all reserved nfts");

  await ((await collection.setPremintPrice(premintPrice)).wait());
  console.log("Set premint price to " + premintPrice);

  await ((await collection.setBaseURI("ipfs://" + ipfsFolder + "/")).wait());
  console.log("Set folder to " + ipfsFolder);

  const nfturi = await collection.tokenURI(0);
  console.log("First nft uri verify the json please : " + nfturi);

  return {
    contractAddress: collection.address,
    constructorArguments
  };
}

async function main() {
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  // const collectionName: string = await new Promise(resolve => {
  //   rl.question("Collection name ?\n", resolve)
  // })
  // const collectionSymbol: string = await new Promise(resolve => {
  //   rl.question("Collection symbol ?\n", resolve)
  // })
  // const collectionSize: string = await new Promise(resolve => {
  //   rl.question("Collection size ?\n", resolve)
  // })
  // const ipfsFolder: string = await new Promise(resolve => {
  //   rl.question("ipfs folder ?\n", resolve)
  // })
  // const tresory: string = await new Promise(resolve => {
  //   rl.question("tresory address ?\n", resolve)
  // })
  // const freeAmount: string = await new Promise(resolve => {
  //   rl.question("Free amount ?\n", resolve)
  // })
  // const premintPrice: string = await new Promise(resolve => {
  //   rl.question("Premint price (eth) ?\n", resolve)
  // })
  // const startMintTimestamp: string = await new Promise(resolve => {
  //   rl.question("Start claim timestamp ?\n", resolve)
  // })
  // const endMintTimestamp: string = await new Promise(resolve => {
  //   rl.question("End claim timestamp ?\n", resolve)
  // })
  // const startPrice: string = await new Promise(resolve => {
  //   rl.question("Price of the first item (eth) ?\n", resolve)
  // })
  // const endPrice: string = await new Promise(resolve => {
  //   rl.question("Price of the last item (eth) ?\n", resolve)
  // })
  // const reservedAmount: string = await new Promise(resolve => {
  //   rl.question("Reserved amount ?\n", resolve)
  // })
  // const whiteListedAddressesInput: string = await new Promise(resolve => {
  //   rl.question("Whitelist (ex : 0x...,0x...,0x...) ?\n", resolve)
  // })

  const [deployer] = await ethers.getSigners();

  const collectionName: string = "Damien";
  const collectionSymbol: string = "DAM";
  const collectionSize: string = "333";
  const ipfsFolder: string = "ipfs://QmVroQG9ofpP8irkvhjkDUzJQ2X5YBqpun4i7rgj1L7Jpv";
  const tresory: string = "0x398b8f0720fF9209Ba894f87390C276B9f0E1604";
  const freeAmount: string = "233";
  const premintPrice: string = "0";
  const maxPremint: string = "30";
  const startPremintTimestamp: string = "1663080928";
  const startMintTimestamp: string = "1663082428";
  const startPrice: string = "0.01";
  const endPrice: string = "0.1";
  const reservedAmount: string = "23";
  const whiteListedAddressesInput: string = deployer.address + ",0x398b8f0720fF9209Ba894f87390C276B9f0E1604,0x7C7630aD33B6fF1803ea279a2DF0738e31f5Cf6c,0x1BAD8132115Ae99444aE9aD3191EbB81e77C740d,0x8574c91D7c27a0f85c2000E588d1Dc7CA000D8DF"

  const whiteListedAddresses = whiteListedAddressesInput.split(",");
  const leafNodes = whiteListedAddresses.map(add => keccak256(add));
  console.log("Whitelisted addresses : ", whiteListedAddresses)
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  whiteListedAddresses.forEach(address => {
    console.log("Proof  : ", address, merkleTree.getHexProof(keccak256(address)));
  });
  const result = await deploy(
    collectionName,
    collectionSymbol,
    +collectionSize,
    ipfsFolder,
    tresory,
    +freeAmount,
    parseEther(premintPrice),
    +startPremintTimestamp,
    +startMintTimestamp,
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