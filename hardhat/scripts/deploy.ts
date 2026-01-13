import { ethers } from "hardhat";

async function main() {
  const Greeter = await ethers.getContractFactory("Greeter");
  const greeter = await Greeter.deploy("Hello, Hardhat!");

  await greeter.deployed();

  console.log("Greeter deployed to:", greeter.address);
  console.log("Initial greeting:", await greeter.greet());

  // Update the greeting
  const tx = await greeter.setGreeting("Hello, ts-ethers!");
  await tx.wait();

  console.log("Updated greeting:", await greeter.greet());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});