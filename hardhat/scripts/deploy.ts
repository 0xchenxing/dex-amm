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

  // 5. 部署单一治理合约（内置延迟，无需 Timelock）
  const VOTING_DELAY = 1;
  const VOTING_PERIOD = 120;
  const QUORUM = 3;
  const MIN_DELAY_SECONDS = 5 * 60; // 5 分钟
  console.log("\n5. 部署 SimpleGovernor 治理合约...");
  const GovernorFactory = await ethers.getContractFactory("SimpleGovernor");
  const governor = await GovernorFactory.deploy(VOTING_DELAY, VOTING_PERIOD, QUORUM, MIN_DELAY_SECONDS);
  await governor.deployed();
  console.log(`   SimpleGovernor 地址: ${governor.address}`);

  // 6. 将 Factory 的 feeToSetter 迁移到治理合约
  console.log("\n6. 迁移 Factory.feeToSetter 到 Governor...");
  const handoverTx = await factory.setFeeToSetter(governor.address);
  await handoverTx.wait();
  console.log(`   Factory.feeToSetter 现为: ${await factory.feeToSetter()}`);

  // 7. 提供合约信息
  console.log("\n=== 部署完成 ===");
  console.log("\n所有合约地址:");
  console.log(`- WETH: ${WETH_SEPOLIA_ADDRESS} (Sepolia 测试网现有合约)`);
  console.log(`- SwapFactory: ${factory.address}`);
  console.log(`- SwapRouter02: ${router.address}`);
  console.log(`- SimpleGovernor: ${governor.address}`);

  console.log("\n使用说明:");
  console.log("1. 通过 Router 合约添加流动性: router.addLiquidity() 或 router.addLiquidityETH()");
  console.log("2. 通过 Router 合约进行代币交换: router.swapExactTokensForTokens() 等");
  console.log("3. 治理: 在 Governor 创建提案，投票通过后 queue，延迟期满后 execute");
  console.log("4. 将 frontend/src/config/contracts.ts 中 DEXAMM_GOVERNOR 设为上述 Governor 地址");

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
