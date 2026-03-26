import { ethers } from "hardhat";

async function main() {
  console.log("=== 开始单独部署 SimpleGovernor 到指定网络 ===");

  const [deployer] = await ethers.getSigners();
  console.log(`部署者地址: ${deployer.address}`);
  console.log(
    `部署者余额: ${ethers.utils.formatEther(
      await deployer.getBalance()
    )} ETH`
  );

  // 这里可以按需要调整治理参数
  const VOTING_DELAY = 1; // 提案创建后 1 个区块开始投票
  const VOTING_PERIOD = 20; // 投票持续 20 个区块
  const QUORUM = 3; // 至少 3 票赞成
  const MIN_DELAY_SECONDS = 30; // queue 后至少等待 30 秒才能执行

  console.log("\n1. 部署 SimpleGovernor 合约...");
  const GovernorFactory = await ethers.getContractFactory("SimpleGovernor");
  const governor = await GovernorFactory.deploy(
    VOTING_DELAY,
    VOTING_PERIOD,
    QUORUM,
    MIN_DELAY_SECONDS
  );
  await governor.deployed();

  console.log(`SimpleGovernor 部署完成，地址: ${governor.address}`);

  console.log("\n使用说明:");
  console.log(
    "- 如果要让治理合约管理 SwapFactory，请用 factory.setFeeToSetter(governor.address) 迁移权限"
  );
  console.log(
    "- 前端请在 frontend/src/config/contracts.ts 中将 DEXAMM_GOVERNOR 设置为上述地址"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败:", error);
    process.exit(1);
  });

