import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, APP_CONFIG } from '../../config/contracts';
import { createContract, getSigner, ContractServiceError } from './base';

/**
 * 代币信息接口
 */
export interface TokenInfo {
  /**
   * 代币地址
   */
  address: string;
  /**
   * 代币符号
   */
  symbol: string;
  /**
   * 代币名称
   */
  name: string;
  /**
   * 代币小数位
   */
  decimals: number;
  /**
   * 代币余额
   */
  balance?: ethers.BigNumberish;
  /**
   * 格式化后的代币余额
   */
  balanceFormatted?: string;
}

/**
 * ERC20 代币合约类
 * 用于与 ERC20 标准代币合约交互
 */
export class ERC20Contract {
  private contract: ethers.Contract;
  private address: string;

  /**
   * 构造函数
   * @param contract 以太坊合约实例
   * @param address 代币合约地址
   */
  constructor(contract: ethers.Contract, address: string) {
    this.contract = contract;
    this.address = address;
  }

  /**
   * 获取账户的代币余额
   * @param account 账户地址
   * @returns 代币余额
   * @throws {ContractServiceError} 当获取代币余额失败时
   */
  async getBalance(account: string): Promise<ethers.BigNumberish> {
    try {
      return await this.contract.balanceOf(account);
    } catch (error) {
      console.error('获取代币余额失败:', error);
      throw new ContractServiceError('获取代币余额失败', 'GET_BALANCE_FAILED');
    }
  }

  /**
   * 获取授权额度
   * @param owner 授权方地址
   * @param spender 被授权方地址
   * @returns 授权额度
   * @throws {ContractServiceError} 当获取授权额度失败时
   */
  async getAllowance(owner: string, spender: string): Promise<ethers.BigNumberish> {
    try {
      return await this.contract.allowance(owner, spender);
    } catch (error) {
      console.error('获取授权额度失败:', error);
      throw new ContractServiceError('获取授权额度失败', 'GET_ALLOWANCE_FAILED');
    }
  }

  /**
   * 授权代币
   * @param spender 被授权方地址
   * @param amount 授权额度
   * @returns 交易回执
   * @throws {ContractServiceError} 当授权代币失败时
   */
  async approve(spender: string, amount: ethers.BigNumberish): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.approve(spender, amount);
      return await tx.wait();
    } catch (error) {
      console.error('授权代币失败:', error);
      throw new ContractServiceError('授权代币失败', 'APPROVE_FAILED');
    }
  }

  /**
   * 转账代币
   * @param to 接收方地址
   * @param amount 转账金额
   * @returns 交易回执
   * @throws {ContractServiceError} 当转账代币失败时
   */
  async transfer(to: string, amount: ethers.BigNumberish): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.transfer(to, amount);
      return await tx.wait();
    } catch (error) {
      console.error('转账代币失败:', error);
      throw new ContractServiceError('转账代币失败', 'TRANSFER_FAILED');
    }
  }

  /**
   * 代转账代币
   * @param from 发送方地址
   * @param to 接收方地址
   * @param amount 转账金额
   * @returns 交易回执
   * @throws {ContractServiceError} 当代转账代币失败时
   */
  async transferFrom(from: string, to: string, amount: ethers.BigNumberish): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.transferFrom(from, to, amount);
      return await tx.wait();
    } catch (error) {
      console.error('代转账代币失败:', error);
      throw new ContractServiceError('代转账代币失败', 'TRANSFER_FROM_FAILED');
    }
  }

  /**
   * 获取代币小数位
   * @returns 代币小数位
   * @throws {ContractServiceError} 当获取代币小数位失败时
   */
  async getDecimals(): Promise<number> {
    try {
      return await this.contract.decimals();
    } catch (error) {
      console.error('获取代币小数位失败:', error);
      throw new ContractServiceError('获取代币小数位失败', 'GET_DECIMALS_FAILED');
    }
  }

  /**
   * 获取代币符号
   * @returns 代币符号
   * @throws {ContractServiceError} 当获取代币符号失败时
   */
  async getSymbol(): Promise<string> {
    try {
      return await this.contract.symbol();
    } catch (error) {
      console.error('获取代币符号失败:', error);
      throw new ContractServiceError('获取代币符号失败', 'GET_SYMBOL_FAILED');
    }
  }

  /**
   * 获取代币名称
   * @returns 代币名称
   * @throws {ContractServiceError} 当获取代币名称失败时
   */
  async getName(): Promise<string> {
    try {
      return await this.contract.name();
    } catch (error) {
      console.error('获取代币名称失败:', error);
      throw new ContractServiceError('获取代币名称失败', 'GET_NAME_FAILED');
    }
  }

  /**
   * 获取代币合约地址
   * @returns 代币合约地址
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * 获取以太坊合约实例
   * @returns 以太坊合约实例
   */
  getContract(): ethers.Contract {
    return this.contract;
  }
}

/**
 * 获取 ERC20 代币合约实例
 * @param tokenAddress 代币合约地址
 * @returns ERC20 代币合约实例
 */
export const getERC20Contract = async (tokenAddress: string): Promise<ERC20Contract> => {
  const contract = await createContract(tokenAddress, CONTRACT_ABIS.ERC20);
  return new ERC20Contract(contract, tokenAddress);
};

/**
 * 根据代币符号获取 ERC20 代币合约实例
 * @param tokenSymbol 代币符号
 * @returns ERC20 代币合约实例
 * @throws {ContractServiceError} 当未找到代币地址时
 */
export const getTokenContract = async (tokenSymbol: string): Promise<ERC20Contract> => {
  const tokenAddress = CONTRACT_ADDRESSES.TOKENS[tokenSymbol as keyof typeof CONTRACT_ADDRESSES.TOKENS];
  if (!tokenAddress) {
    throw new ContractServiceError(`未找到代币 ${tokenSymbol} 的地址`, 'TOKEN_NOT_FOUND');
  }
  return await getERC20Contract(tokenAddress);
};

/**
 * 获取代币余额
 * @param tokenSymbol 代币符号
 * @param account 账户地址
 * @returns 格式化后的代币余额
 * @throws {ContractServiceError} 当获取代币余额失败时
 */
export const getTokenBalance = async (tokenSymbol: string, account: string): Promise<string> => {
  try {
    const tokenContract = await getTokenContract(tokenSymbol);
    const balance = await tokenContract.getBalance(account);
    const decimals = APP_CONFIG.DECIMALS[tokenSymbol as keyof typeof APP_CONFIG.DECIMALS] || 18;
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('获取代币余额失败:', error);
    throw new ContractServiceError('获取代币余额失败', 'GET_TOKEN_BALANCE_FAILED');
  }
};

/**
 * 授权代币
 * @param tokenSymbol 代币符号
 * @param spender 被授权方地址
 * @param amount 授权额度，默认使用最大值
 * @returns 交易回执
 * @throws {ContractServiceError} 当授权代币失败时
 */
export const approveToken = async (
  tokenSymbol: string,
  spender: string,
  amount?: ethers.BigNumberish
): Promise<ethers.TransactionReceipt> => {
  try {
    const tokenContract = await getTokenContract(tokenSymbol);
    const approvalAmount = amount || ethers.MaxUint256;
    return await tokenContract.approve(spender, approvalAmount);
  } catch (error) {
    console.error('授权代币失败:', error);
    throw new ContractServiceError('授权代币失败', 'APPROVE_TOKEN_FAILED');
  }
};

/**
 * 检查并授权代币
 * @param tokenSymbol 代币符号
 * @param spender 被授权方地址
 * @param requiredAmount 需要的授权额度
 * @returns 是否进行了授权操作
 * @throws {ContractServiceError} 当检查并授权代币失败时
 */
export const checkAndApproveToken = async (
  tokenSymbol: string,
  spender: string,
  requiredAmount: ethers.BigNumberish
): Promise<boolean> => {
  try {
    const tokenContract = await getTokenContract(tokenSymbol);
    const signer = await getSigner();
    const owner = await signer.getAddress();
    
    const currentAllowance = await tokenContract.getAllowance(owner, spender);
    const requiredAmountBN = BigInt(requiredAmount);
    
    if (BigInt(currentAllowance) < requiredAmountBN) {
      await tokenContract.approve(spender, ethers.MaxUint256);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('检查并授权代币失败:', error);
    throw new ContractServiceError('检查并授权代币失败', 'CHECK_APPROVE_FAILED');
  }
};

/**
 * 获取所有代币余额
 * @param account 账户地址
 * @returns 所有代币的余额映射
 * @throws {ContractServiceError} 当获取所有代币余额失败时
 */
export const getAllTokenBalances = async (account: string): Promise<Record<string, string>> => {
  const balances: Record<string, string> = {};
  
  try {
    for (const [symbol, address] of Object.entries(CONTRACT_ADDRESSES.TOKENS)) {
      if (symbol !== 'ETH') {
        const tokenContract = await getERC20Contract(address);
        const balance = await tokenContract.getBalance(account);
        const decimals = APP_CONFIG.DECIMALS[symbol as keyof typeof APP_CONFIG.DECIMALS] || 18;
        balances[symbol] = ethers.formatUnits(balance, decimals);
      }
    }
    
    return balances;
  } catch (error) {
    console.error('获取所有代币余额失败:', error);
    throw new ContractServiceError('获取所有代币余额失败', 'GET_ALL_BALANCES_FAILED');
  }
};

/**
 * 按代币地址检查并授权代币
 * @param tokenAddress 代币合约地址
 * @param spender 被授权方地址
 * @param requiredAmount 需要的授权额度
 * @returns 是否进行了授权操作
 * @throws {ContractServiceError} 当检查并授权代币失败时
 */
export const checkAndApproveTokenByAddress = async (
  tokenAddress: string,
  spender: string,
  requiredAmount: ethers.BigNumberish
): Promise<boolean> => {
  try {
    // 先转换为小写，再使用 getAddress 进行校验和验证
    const normalizedTokenAddress = ethers.getAddress(tokenAddress.toLowerCase());
    const normalizedSpender = ethers.getAddress(spender.toLowerCase());
    
    const tokenContract = await getERC20Contract(normalizedTokenAddress);
    const signer = await getSigner();
    const owner = await signer.getAddress();
    
    try {
      // 尝试获取授权额度
      const currentAllowance = await tokenContract.getAllowance(owner, normalizedSpender);
      const requiredAmountBN = BigInt(requiredAmount);
      
      console.log(`检查代币授权 - 地址: ${normalizedTokenAddress}`);
      console.log(`当前授权额度: ${currentAllowance}`);
      console.log(`需要的授权额度: ${requiredAmountBN}`);
      
      if (BigInt(currentAllowance) < requiredAmountBN) {
        console.log(`授权额度不足，正在授权...`);
        await tokenContract.approve(normalizedSpender, ethers.MaxUint256);
        console.log(`授权成功`);
        return true;
      }
      
      console.log(`授权额度充足，无需授权`);
      return false;
    } catch (error) {
      console.error('获取授权额度失败，直接尝试授权:', error);
      // 获取授权额度失败，直接尝试授权
      console.log(`直接尝试授权...`);
      await tokenContract.approve(normalizedSpender, ethers.MaxUint256);
      console.log(`授权成功`);
      return true;
    }
  } catch (error) {
    console.error('按地址检查并授权代币失败:', error);
    throw new ContractServiceError('按地址检查并授权代币失败', 'CHECK_APPROVE_BY_ADDRESS_FAILED');
  }
};
