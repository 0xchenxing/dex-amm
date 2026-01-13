import { ethers } from "hardhat";

async function main() {
  console.log("Testing ethers.js with Hardhat...");
  
  // Get the signers
  const [signer] = await ethers.getSigners();
  console.log(`Connected with signer: ${signer.address}`);
  
  // Check balance
  const balance = await signer.getBalance();
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
  
  console.log("ts-ethers configuration is working correctly!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});