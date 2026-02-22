import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { createContract, ContractServiceError } from './base';

/**
 * Factory 合约类
 * 用于与 Uniswap V2 或 DEX-AMM 的 Factory 合约交互
 */
export class FactoryContract {
  private contract: ethers.Contract;
  private address: string;

  /**
   * 构造函数
   * @param contract 以太坊合约实例
   * @param address Factory 合约地址
   */
  constructor(contract: ethers.Contract, address: string) {
    this.contract = contract;
    this.address = address;
  }

  /**
   * 创建交易对
   * @param tokenA 代币A地址
   * @param tokenB 代币B地址
   * @returns 交易回执
   * @throws {ContractServiceError} 当创建交易对失败时
   */
  async createPair(tokenA: string, tokenB: string): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.createPair(tokenA, tokenB);
      return await tx.wait();
    } catch (error) {
      console.error('创建交易对失败:', error);
      throw new ContractServiceError('创建交易对失败', 'CREATE_PAIR_FAILED');
    }
  }

  /**
   * 获取交易对地址
   * @param tokenA 代币A地址
   * @param tokenB 代币B地址
   * @returns 交易对地址
   * @throws {ContractServiceError} 当获取交易对地址失败时
   */
  async getPair(tokenA: string, tokenB: string): Promise<string> {
    try {
      return await this.contract.getPair(tokenA, tokenB);
    } catch (error) {
      console.error('获取交易对地址失败:', error);
      throw new ContractServiceError('获取交易对地址失败', 'GET_PAIR_FAILED');
    }
  }

  /**
   * 获取所有交易对
   * @param length 交易对数量
   * @returns 交易对地址数组
   * @throws {ContractServiceError} 当获取所有交易对失败时
   */
  async allPairs(length: number): Promise<string[]> {
    try {
      const pairs: string[] = [];
      for (let i = 0; i < length; i++) {
        pairs.push(await this.contract.allPairs(i));
      }
      return pairs;
    } catch (error) {
      console.error('获取所有交易对失败:', error);
      throw new ContractServiceError('获取所有交易对失败', 'GET_ALL_PAIRS_FAILED');
    }
  }

  /**
   * 获取交易对数量
   * @returns 交易对数量
   * @throws {ContractServiceError} 当获取交易对数量失败时
   */
  async allPairsLength(): Promise<number> {
    try {
      const length = await this.contract.allPairsLength();
      return Number(length);
    } catch (error) {
      console.error('获取交易对数量失败:', error);
      throw new ContractServiceError('获取交易对数量失败', 'GET_PAIRS_LENGTH_FAILED');
    }
  }

  /**
   * 获取费用接收地址
   * @returns 费用接收地址
   * @throws {ContractServiceError} 当获取费用接收地址失败时
   */
  async feeTo(): Promise<string> {
    try {
      return await this.contract.feeTo();
    } catch (error) {
      console.error('获取费用接收地址失败:', error);
      throw new ContractServiceError('获取费用接收地址失败', 'GET_FEE_TO_FAILED');
    }
  }

  /**
   * 获取费用设置者
   * @returns 费用设置者地址
   * @throws {ContractServiceError} 当获取费用设置者失败时
   */
  async feeToSetter(): Promise<string> {
    try {
      return await this.contract.feeToSetter();
    } catch (error) {
      console.error('获取费用设置者失败:', error);
      throw new ContractServiceError('获取费用设置者失败', 'GET_FEE_TO_SETTER_FAILED');
    }
  }

  /**
   * 获取 Factory 合约地址
   * @returns Factory 合约地址
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
 * 获取 Uniswap Factory 合约实例
 * @returns Uniswap Factory 合约实例
 * @throws {ContractServiceError} 当获取 Uniswap Factory 合约失败时
 */
export const getUniswapFactoryContract = async (): Promise<FactoryContract> => {
  try {
    const factoryABI = [
      'function createPair(address tokenA, address tokenB) external returns (address pair)',
      'function getPair(address tokenA, address tokenB) external view returns (address pair)',
      'function allPairs(uint) external view returns (address pair)',
      'function allPairsLength() external view returns (uint)',
      'function feeTo() external view returns (address)',
      'function feeToSetter() external view returns (address)'
    ];

    const contract = await createContract(
      CONTRACT_ADDRESSES.UNISWAPV2_FACTORY,
      factoryABI
    );
    
    return new FactoryContract(contract, CONTRACT_ADDRESSES.UNISWAPV2_FACTORY);
  } catch (error) {
    console.error('获取Uniswap Factory合约失败:', error);
    throw new ContractServiceError('获取Uniswap Factory合约失败', 'GET_UNISWAP_FACTORY_FAILED');
  }
};

/**
 * 获取 DEX-AMM Factory 合约实例
 * @returns DEX-AMM Factory 合约实例
 * @throws {ContractServiceError} 当获取 DEX-AMM Factory 合约失败时
 */
export const getDexAmmFactoryContract = async (): Promise<FactoryContract> => {
  try {
    const factoryABI = [
      'function createPair(address tokenA, address tokenB) external returns (address pair)',
      'function getPair(address tokenA, address tokenB) external view returns (address pair)',
      'function allPairs(uint) external view returns (address pair)',
      'function allPairsLength() external view returns (uint)',
      'function feeTo() external view returns (address)',
      'function feeToSetter() external view returns (address)'
    ];

    const contract = await createContract(
      CONTRACT_ADDRESSES.DEXAMM_FACTORY,
      factoryABI
    );
    
    return new FactoryContract(contract, CONTRACT_ADDRESSES.DEXAMM_FACTORY);
  } catch (error) {
    console.error('获取DEX-AMM Factory合约失败:', error);
    throw new ContractServiceError('获取DEX-AMM Factory合约失败', 'GET_DEXAMM_FACTORY_FAILED');
  }
};

/**
 * 创建交易对
 * @param factoryType 工厂类型 ('uniswap' 或 'dexamm')
 * @param tokenA 代币A地址
 * @param tokenB 代币B地址
 * @returns 交易对地址
 * @throws {ContractServiceError} 当创建交易对失败时
 */
export const createTradingPair = async (
  factoryType: 'uniswap' | 'dexamm',
  tokenA: string,
  tokenB: string
): Promise<string> => {
  try {
    const factoryContract = factoryType === 'uniswap' 
      ? await getUniswapFactoryContract() 
      : await getDexAmmFactoryContract();
    
    const receipt = await factoryContract.createPair(tokenA, tokenB);
    
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    if (pairAddress === ethers.ZeroAddress) {
      throw new ContractServiceError('交易对创建失败，未找到交易对地址', 'PAIR_CREATION_FAILED');
    }
    
    console.log('交易对创建成功:', pairAddress);
    return pairAddress;
  } catch (error) {
    console.error('创建交易对失败:', error);
    throw new ContractServiceError('创建交易对失败', 'CREATE_TRADING_PAIR_FAILED');
  }
};

/**
 * 获取交易对地址
 * @param factoryType 工厂类型 ('uniswap' 或 'dexamm')
 * @param tokenA 代币A地址
 * @param tokenB 代币B地址
 * @returns 交易对地址
 * @throws {ContractServiceError} 当获取交易对地址失败或交易对不存在时
 */
export const getTradingPairAddress = async (
  factoryType: 'uniswap' | 'dexamm',
  tokenA: string,
  tokenB: string
): Promise<string> => {
  try {
    const factoryContract = factoryType === 'uniswap' 
      ? await getUniswapFactoryContract() 
      : await getDexAmmFactoryContract();
    
    const pairAddress = await factoryContract.getPair(tokenA, tokenB);
    
    if (pairAddress === ethers.ZeroAddress) {
      throw new ContractServiceError('交易对不存在', 'PAIR_NOT_FOUND');
    }
    
    return pairAddress;
  } catch (error) {
    console.error('获取交易对地址失败:', error);
    throw new ContractServiceError('获取交易对地址失败', 'GET_TRADING_PAIR_FAILED');
  }
};

/**
 * 获取所有交易对
 * @param factoryType 工厂类型 ('uniswap' 或 'dexamm')
 * @returns 交易对地址数组
 * @throws {ContractServiceError} 当获取所有交易对失败时
 */
export const getAllTradingPairs = async (
  factoryType: 'uniswap' | 'dexamm'
): Promise<string[]> => {
  try {
    const factoryContract = factoryType === 'uniswap' 
      ? await getUniswapFactoryContract() 
      : await getDexAmmFactoryContract();
    
    const length = await factoryContract.allPairsLength();
    return await factoryContract.allPairs(length);
  } catch (error) {
    console.error('获取所有交易对失败:', error);
    throw new ContractServiceError('获取所有交易对失败', 'GET_ALL_TRADING_PAIRS_FAILED');
  }
};
