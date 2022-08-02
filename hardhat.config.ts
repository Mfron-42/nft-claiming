import "@nomiclabs/hardhat-waffle";
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";

dotenv.config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.8.1",
  defaultNetwork: "bsc",
  networks: {
    
    hardhat: {

    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [process.env.PRIVATE_KEY]
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/00f257d0851449ee8a3d43f43279e979",
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://bscscan.com/
    apiKey: {
      bsc:"VNEXV6DNI5UZFB73RNDB43WE7W6145KNX8",
      mainnet: "IEQY4RUYYAEJCSQMKC97T5233MTF38J2YZ",
      ropsten: "IEQY4RUYYAEJCSQMKC97T5233MTF38J2YZ"
    }
  },
};
