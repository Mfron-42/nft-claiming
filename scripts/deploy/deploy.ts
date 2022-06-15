import { BigNumber, BigNumberish } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { ERC721Claimable } from "../../typechain-types/ERC721Claimable";
import * as readline  from "readline";
import hre from "hardhat";


export async function deploy(
    ipfsFolder: string,
    tresory: string,
    claimPrice: number,
    collectionName: string,
    collectionSymbol: string,
    collectionSize: number) : Promise<string> {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    const contractFactory = await ethers.getContractFactory("ERC721Claimable");
    const collection = await contractFactory.deploy(collectionName, collectionSymbol);
    await collection.deployed();
    console.log("contract deployed address:", collection.address);
    await ((await collection.setTresory(tresory)).wait());
    console.log("Tresory set to ", tresory);
    await ((await collection.mintBatch(collectionSize)).wait());
    console.log("Mint " + collectionSize + " nfts");
    const price = parseEther(claimPrice.toString());
    await ((await collection.setPrice(price)).wait());
    console.log("Set claim price to " + price);
    await ((await collection.setBaseURI("ipfs://" + ipfsFolder + "/")).wait());
    console.log("Set folder to " + ipfsFolder);
    const nfturi = await collection.tokenURI(0);
    console.log("First nft uri verify the json please : " + nfturi);
    return collection.address;
}

async function main() {
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const ipfsFolder : string = await new Promise(resolve => {
        rl.question("ipfs folder ?\n", resolve)
      })
      const tresory : string = await new Promise(resolve => {
        rl.question("tresory address ?\n", resolve)
      })
      const claimPrice : string = await new Promise(resolve => {
        rl.question("Claim price ?\n", resolve)
      })
      const collectionName : string = await new Promise(resolve => {
        rl.question("Collection name ?\n", resolve)
      })
      const collectionSymbol : string = await new Promise(resolve => {
        rl.question("Collection symbol ?\n", resolve)
      })
      const collectionSize : string = await new Promise(resolve => {
        rl.question("Collection size ?\n", resolve)
      })
    const address = await deploy(ipfsFolder, tresory, +claimPrice, collectionName, collectionSymbol, +collectionSize);
    console.log("Nft contract deployed : " + address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });