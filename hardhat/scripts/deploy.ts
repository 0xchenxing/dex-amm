import { ethers } from "hardhat";
import { Contract } from "ethers";

async function main() {
  console.log("=== 开始部署 Swap  合约到 Sepolia 测试网 ===");

  // 1. 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log(`\n1.部署者账户: ${deployer.address}`);
  console.log(`部署者余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // 2. 使用 Sepolia 上已有的 WETH 合约
  // Sepolia 测试网 WETH 地址
  const WETH_SEPOLIA_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  console.log(`\n2. 使用 Sepolia 上已有的 WETH 合约:`);
  console.log(`   WETH 合约地址: ${WETH_SEPOLIA_ADDRESS}`);

  // 3. 部署 SwapFactory 合约
  console.log("\n3. 部署 SwapFactory 合约...");
  
  const FactoryFactory = await ethers.getContractFactory("SwapFactory");
  const factory = await FactoryFactory.deploy(deployer.address); // 部署者作为手续费接收者设置者
  await factory.deployed();
  
  console.log(`   SwapFactory 合约部署地址: ${factory.address}`);
  console.log(`   手续费设置者: ${await factory.feeToSetter()}`);

  // 4. 部署 SwapRouter02 合约
  console.log("\n4. 部署 SwapRouter02 合约...");
  
  const RouterFactory = await ethers.getContractFactory("SwapRouter02");
  const router = await RouterFactory.deploy(factory.address, WETH_SEPOLIA_ADDRESS);
  await router.deployed();
  
  console.log(`   SwapRouter02 合约部署地址: ${router.address}`);
  console.log(`   Router 使用的 Factory 地址: ${await router.factory()}`);
  console.log(`   Router 使用的 WETH 地址: ${await router.WETH()}`);

  // 5. 提供合约信息
  console.log("\n=== 部署完成 ===");
  console.log("\n所有合约地址:");
  console.log(`- WETH: ${WETH_SEPOLIA_ADDRESS} (Sepolia 测试网现有合约)`);
  console.log(`- SwapFactory: ${factory.address}`);
  console.log(`- SwapRouter02: ${router.address}`);
  
  console.log("\n使用说明:");
  console.log("1. 通过 Router 合约添加流动性: router.addLiquidity() 或 router.addLiquidityETH()");
  console.log("2. 通过 Router 合约进行代币交换: router.swapExactTokensForTokens() 等");
  console.log("3. 查看交易对信息: 可以通过 Factory 合约获取所有交易对");
  
  console.log("\n注意:");
  console.log("- 在添加流动性前，需要先向 Router 合约授权代币");
  console.log("- 使用 Sepolia 测试网需要 Sepolia ETH 作为 Gas 费用");
  console.log("- 部署前请确保已在 hardhat.config.ts 中配置正确的 Sepolia 节点 URL 和私钥");
}

// 执行部署脚本
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });
