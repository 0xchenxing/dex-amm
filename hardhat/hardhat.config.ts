import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = { 
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "paris"
        }
      }
    ]
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/ce40b138bd1347b29657ec11820c95ac", // 替换为你的Infura API密钥或其他Sepolia节点URL
      accounts: ["8e54bc23d0e98a3ac7337f3dc0267acd80b488905f89397e5510218071f44b3c"], // 替换为你的部署者私钥
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.API_KEY || "",
    },
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }
    ]
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 21
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    deploy: "./deploy",
    deployments: "./deployments"
  },
  namedAccounts: {
    deployer: {
      default: 0
    }
  }
} as HardhatUserConfig;

export default config;