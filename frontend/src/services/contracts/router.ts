import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, APP_CONFIG } from '../../config/contracts';
import { createContract, getSigner, ContractServiceError } from './base';
import { checkAndApproveToken } from './erc20';

/**
 * 交易选项接口
 */
export interface TradeOptions {
  /**
   * 滑点容忍度，默认为 0.01 (1%)
   */
  slippageTolerance?: number;
  /**
   * 交易截止时间，默认为当前时间 + 20 分钟
   */
  deadline?: number;
  /**
   * 接收方地址，默认为当前签名者地址
   */
  recipient?: string;
}

/**
 * 交易结果接口
 */
export interface TradeResult {
  /**
   * 交易哈希
   */
  txHash: string;
  /**
   * 输入金额
   */
  amountIn: string;
  /**
   * 输出金额
   */
  amountOut: string;
  /**
   * 最小输出金额
   */
  amountOutMin: string;
  /**
   * 交易路径
   */
  path: string[];
  /**
   * 交易时间戳
   */
  timestamp: number;
}

/**
 * Router 合约类
 * 用于与 Uniswap V2 或 DEX-AMM 的 Router 合约交互
 */
export class RouterContract {
  private contract: ethers.Contract;
  private address: string;

  /**
   * 构造函数
   * @param contract 以太坊合约实例
   * @param address Router 合约地址
   */
  constructor(contract: ethers.Contract, address: string) {
    this.contract = contract;
    this.address = address;
  }

  /**
   * 获取输出金额
   * @param amountIn 输入金额
   * @param path 交易路径
   * @returns 各路径的输出金额数组
   * @throws {ContractServiceError} 当获取输出金额失败时
   */
  async getAmountsOut(amountIn: ethers.BigNumberish, path: string[]): Promise<ethers.BigNumberish[]> {
    try {
      return await this.contract.getAmountsOut(amountIn, path);
    } catch (error) {
      console.error('获取输出金额失败:', error);
      throw new ContractServiceError('获取输出金额失败', 'GET_AMOUNTS_OUT_FAILED');
    }
  }

  /**
   * 获取输入金额
   * @param amountOut 输出金额
   * @param path 交易路径
   * @returns 各路径的输入金额数组
   * @throws {ContractServiceError} 当获取输入金额失败时
   */
  async getAmountsIn(amountOut: ethers.BigNumberish, path: string[]): Promise<ethers.BigNumberish[]> {
    try {
      return await this.contract.getAmountsIn(amountOut, path);
    } catch (error) {
      console.error('获取输入金额失败:', error);
      throw new ContractServiceError('获取输入金额失败', 'GET_AMOUNTS_IN_FAILED');
    }
  }

  /**
   * 执行代币兑换（指定输入金额）
   * @param amountIn 输入金额
   * @param amountOutMin 最小输出金额
   * @param path 交易路径
   * @param to 接收方地址
   * @param deadline 交易截止时间
   * @returns 交易回执
   * @throws {ContractServiceError} 当执行代币兑换失败时
   */
  async swapExactTokensForTokens(
    amountIn: ethers.BigNumberish,
    amountOutMin: ethers.BigNumberish,
    path: string[],
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        to,
        deadline
      );
      return await tx.wait();
    } catch (error) {
      console.error('执行代币兑换失败:', error);
      throw new ContractServiceError('执行代币兑换失败', 'SWAP_FAILED');
    }
  }

  /**
   * 执行代币兑换（指定输出金额）
   * @param amountOut 输出金额
   * @param amountInMax 最大输入金额
   * @param path 交易路径
   * @param to 接收方地址
   * @param deadline 交易截止时间
   * @returns 交易回执
   * @throws {ContractServiceError} 当执行代币兑换失败时
   */
  async swapTokensForExactTokens(
    amountOut: ethers.BigNumberish,
    amountInMax: ethers.BigNumberish,
    path: string[],
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.swapTokensForExactTokens(
        amountOut,
        amountInMax,
        path,
        to,
        deadline
      );
      return await tx.wait();
    } catch (error) {
      console.error('执行代币兑换失败:', error);
      throw new ContractServiceError('执行代币兑换失败', 'SWAP_EXACT_FAILED');
    }
  }

  /**
   * 获取 Router 合约地址
   * @returns Router 合约地址
   */
  getAddress(): string {
    return this.address;
  }

  /**
   * 添加流动性
   * @param tokenA 代币A地址
   * @param tokenB 代币B地址
   * @param amountADesired 期望的代币A数量
   * @param amountBDesired 期望的代币B数量
   * @param amountAMin 最小代币A数量
   * @param amountBMin 最小代币B数量
   * @param to 接收方地址
   * @param deadline 交易截止时间
   * @returns 交易回执
   * @throws {ContractServiceError} 当添加流动性失败时
   */
  async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountADesired: ethers.BigNumberish,
    amountBDesired: ethers.BigNumberish,
    amountAMin: ethers.BigNumberish,
    amountBMin: ethers.BigNumberish,
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        to,
        deadline
      );
      return await tx.wait();
    } catch (error) {
      console.error('添加流动性失败:', error);
      throw new ContractServiceError('添加流动性失败', 'ADD_LIQUIDITY_FAILED');
    }
  }

  /**
   * 移除流动性
   * @param tokenA 代币A地址
   * @param tokenB 代币B地址
   * @param liquidity LP代币数量
   * @param amountAMin 最小代币A数量
   * @param amountBMin 最小代币B数量
   * @param to 接收方地址
   * @param deadline 交易截止时间
   * @returns 交易回执
   * @throws {ContractServiceError} 当移除流动性失败时
   */
  async removeLiquidity(
    tokenA: string,
    tokenB: string,
    liquidity: ethers.BigNumberish,
    amountAMin: ethers.BigNumberish,
    amountBMin: ethers.BigNumberish,
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const tx = await this.contract.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        to,
        deadline
      );
      return await tx.wait();
    } catch (error) {
      console.error('移除流动性失败:', error);
      throw new ContractServiceError('移除流动性失败', 'REMOVE_LIQUIDITY_FAILED');
    }
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
 * 获取 Uniswap Router 合约实例
 * @returns Uniswap Router 合约实例
 */
export const getUniswapRouterContract = async (): Promise<RouterContract> => {
  const contract = await createContract(
    CONTRACT_ADDRESSES.UNISWAPV2_ROUTER02,
    CONTRACT_ABIS.UNISWAPV2_ROUTER02
  );
  return new RouterContract(contract, CONTRACT_ADDRESSES.UNISWAPV2_ROUTER02);
};

/**
 * 获取 DEX-AMM Router 合约实例
 * @returns DEX-AMM Router 合约实例
 */
export const getDexAmmRouterContract = async (): Promise<RouterContract> => {
  const contract = await createContract(
    CONTRACT_ADDRESSES.DEXAMM_ROUTER02,
    CONTRACT_ABIS.UNISWAPV2_ROUTER02
  );
  return new RouterContract(contract, CONTRACT_ADDRESSES.DEXAMM_ROUTER02);
};

/**
 * 获取交易路径
 * @param inputToken 输入代币符号
 * @param outputToken 输出代币符号
 * @returns 交易路径数组
 * @throws {ContractServiceError} 当代币对无效时
 */
export const getTradePath = (inputToken: string, outputToken: string): string[] => {
  const { TOKENS } = CONTRACT_ADDRESSES;
  const inputAddress = TOKENS[inputToken as keyof typeof TOKENS];
  const outputAddress = TOKENS[outputToken as keyof typeof TOKENS];
  
  if (!inputAddress || !outputAddress) {
    throw new ContractServiceError('无效的代币对', 'INVALID_TOKEN_PAIR');
  }
  
  return [inputAddress, outputAddress];
};

/**
 * 计算交易金额
 * @param routerContract Router 合约实例
 * @param inputToken 输入代币符号
 * @param outputToken 输出代币符号
 * @param amountIn 输入金额
 * @returns 输入和输出金额
 * @throws {ContractServiceError} 当计算交易金额失败时
 */
export const calculateTradeAmounts = async (
  routerContract: RouterContract,
  inputToken: string,
  outputToken: string,
  amountIn: number
): Promise<{ amountIn: ethers.BigNumberish; amountOut: ethers.BigNumberish }> => {
  try {
    const path = getTradePath(inputToken, outputToken);
    const decimals = APP_CONFIG.DECIMALS[inputToken as keyof typeof APP_CONFIG.DECIMALS] || 18;
    const amountInBN = ethers.parseUnits(amountIn.toString(), decimals);
    
    const amounts = await routerContract.getAmountsOut(amountInBN, path);
    
    return {
      amountIn: amountInBN,
      amountOut: amounts[amounts.length - 1]
    };
  } catch (error) {
    console.error('计算交易金额失败:', error);
    throw new ContractServiceError('计算交易金额失败', 'CALCULATE_AMOUNTS_FAILED');
  }
};

/**
 * 执行交易
 * @param routerType Router 类型 ('uniswap' 或 'dexamm')
 * @param inputToken 输入代币符号
 * @param outputToken 输出代币符号
 * @param amount 交易金额
 * @param options 交易选项
 * @returns 交易结果
 * @throws {ContractServiceError} 当执行交易失败时
 */
export const executeTrade = async (
  routerType: 'uniswap' | 'dexamm',
  inputToken: string,
  outputToken: string,
  amount: number,
  options: TradeOptions = {}
): Promise<TradeResult> => {
  try {
    const {
      slippageTolerance = 0.01,
      deadline = Math.floor(Date.now() / 1000) + 60 * 20,
      recipient
    } = options;

    const routerContract = routerType === 'uniswap' 
      ? await getUniswapRouterContract() 
      : await getDexAmmRouterContract();

    const signer = await getSigner();
    const to = recipient || await signer.getAddress();
    const path = getTradePath(inputToken, outputToken);
    
    const decimals = APP_CONFIG.DECIMALS[inputToken as keyof typeof APP_CONFIG.DECIMALS] || 18;
    const amountInBN = ethers.parseUnits(amount.toString(), decimals);
    
    const amounts = await routerContract.getAmountsOut(amountInBN, path);
    const amountOutBN = amounts[amounts.length - 1];
    const slippageNumerator = ethers.parseUnits((1 - slippageTolerance).toString(), 18);
    const amountOutMinBN = (BigInt(amountOutBN) * slippageNumerator) / ethers.parseUnits('1', 18);

    
    await checkAndApproveToken(inputToken, routerContract.getAddress(), amountInBN);
    
    const receipt = await routerContract.swapExactTokensForTokens(
      amountInBN,
      amountOutMinBN,
      path,
      to,
      deadline
    );
    
    const outputDecimals = APP_CONFIG.DECIMALS[outputToken as keyof typeof APP_CONFIG.DECIMALS] || 18;
    
    return {
      txHash: receipt.hash,
      amountIn: ethers.formatUnits(amountInBN, decimals),
      amountOut: ethers.formatUnits(amountOutBN, outputDecimals),
      amountOutMin: ethers.formatUnits(amountOutMinBN, outputDecimals),
      path,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('执行交易失败:', error);
    throw new ContractServiceError('执行交易失败', 'EXECUTE_TRADE_FAILED');
  }
};

/**
 * 获取代币价格
 * @param routerType Router 类型 ('uniswap' 或 'dexamm')
 * @param baseToken 基础代币符号
 * @param quoteToken 报价代币符号
 * @returns 代币价格
 * @throws {ContractServiceError} 当获取价格失败时
 */
export const getPrice = async (
  routerType: 'uniswap' | 'dexamm',
  baseToken: string,
  quoteToken: string
): Promise<number> => {
  try {
    const routerContract = routerType === 'uniswap' 
      ? await getUniswapRouterContract() 
      : await getDexAmmRouterContract();
    
    const path = getTradePath(baseToken, quoteToken);
    const amountIn = ethers.parseUnits('1', APP_CONFIG.DECIMALS[baseToken as keyof typeof APP_CONFIG.DECIMALS] || 18);
    
    const amounts = await routerContract.getAmountsOut(amountIn, path);
    const amountOut = amounts[amounts.length - 1];
    
    return parseFloat(ethers.formatUnits(amountOut, APP_CONFIG.DECIMALS[quoteToken as keyof typeof APP_CONFIG.DECIMALS] || 18));
  } catch (error) {
    console.error('获取价格失败:', error);
    throw new ContractServiceError('获取价格失败', 'GET_PRICE_FAILED');
  }
};

/**
 * 执行添加流动性操作
 * @param routerType Router 类型 ('uniswap' 或 'dexamm')
 * @param tokenA 代币A符号
 * @param tokenB 代币B符号
 * @param amountA 代币A数量
 * @param amountB 代币B数量
 * @param slippageTolerance 滑点容忍度，默认为 0.005 (0.5%)
 * @param options 交易选项
 * @returns 交易结果
 * @throws {ContractServiceError} 当执行添加流动性失败时
 */
export const executeAddLiquidity = async (
  routerType: 'uniswap' | 'dexamm',
  tokenA: string,
  tokenB: string,
  amountA: number,
  amountB: number,
  slippageTolerance: number = 0.005,
  options: TradeOptions = {}
): Promise<TradeResult> => {
  try {
    const {
      deadline = Math.floor(Date.now() / 1000) + 60 * 20,
      recipient
    } = options;

    const routerContract = routerType === 'uniswap' 
      ? await getUniswapRouterContract() 
      : await getDexAmmRouterContract();

    const signer = await getSigner();
    const to = recipient || await signer.getAddress();

    const { TOKENS } = CONTRACT_ADDRESSES;
    const tokenAAddress = TOKENS[tokenA as keyof typeof TOKENS];
    const tokenBAddress = TOKENS[tokenB as keyof typeof TOKENS];

    if (!tokenAAddress || !tokenBAddress) {
      throw new ContractServiceError('无效的代币对', 'INVALID_TOKEN_PAIR');
    }

    const decimalsA = APP_CONFIG.DECIMALS[tokenA as keyof typeof APP_CONFIG.DECIMALS] || 18;
    const decimalsB = APP_CONFIG.DECIMALS[tokenB as keyof typeof APP_CONFIG.DECIMALS] || 18;

    const amountABN = ethers.parseUnits(amountA.toString(), decimalsA);
    const amountBBN = ethers.parseUnits(amountB.toString(), decimalsB);

    const slippageNumerator = ethers.parseUnits((1 - slippageTolerance).toString(), 18);
    const amountAMinBN = (BigInt(amountABN) * slippageNumerator) / ethers.parseUnits('1', 18);
    const amountBMinBN = (BigInt(amountBBN) * slippageNumerator) / ethers.parseUnits('1', 18);

    await checkAndApproveToken(tokenA, routerContract.getAddress(), amountABN);
    await checkAndApproveToken(tokenB, routerContract.getAddress(), amountBBN);

    const receipt = await routerContract.addLiquidity(
      tokenAAddress,
      tokenBAddress,
      amountABN,
      amountBBN,
      amountAMinBN,
      amountBMinBN,
      to,
      deadline
    );

    return {
      txHash: receipt.hash,
      amountIn: ethers.formatUnits(amountABN, decimalsA),
      amountOut: ethers.formatUnits(amountBBN, decimalsB),
      amountOutMin: ethers.formatUnits(amountAMinBN, decimalsA),
      path: [tokenAAddress, tokenBAddress],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('执行添加流动性失败:', error);
    throw new ContractServiceError('执行添加流动性失败', 'EXECUTE_ADD_LIQUIDITY_FAILED');
  }
};

/**
 * 执行移除流动性操作
 * @param routerType Router 类型 ('uniswap' 或 'dexamm')
 * @param tokenA 代币A符号
 * @param tokenB 代币B符号
 * @param liquidity LP代币数量
 * @param slippageTolerance 滑点容忍度，默认为 0.005 (0.5%)
 * @param options 交易选项
 * @returns 交易结果
 * @throws {ContractServiceError} 当执行移除流动性失败时
 */
export const executeRemoveLiquidity = async (
  routerType: 'uniswap' | 'dexamm',
  tokenA: string,
  tokenB: string,
  liquidity: number,
  slippageTolerance: number = 0.005,
  options: TradeOptions = {}
): Promise<TradeResult> => {
  try {
    const {
      deadline = Math.floor(Date.now() / 1000) + 60 * 20,
      recipient
    } = options;

    const routerContract = routerType === 'uniswap' 
      ? await getUniswapRouterContract() 
      : await getDexAmmRouterContract();

    const signer = await getSigner();
    const to = recipient || await signer.getAddress();

    const { TOKENS } = CONTRACT_ADDRESSES;
    const tokenAAddress = TOKENS[tokenA as keyof typeof TOKENS];
    const tokenBAddress = TOKENS[tokenB as keyof typeof TOKENS];

    if (!tokenAAddress || !tokenBAddress) {
      throw new ContractServiceError('无效的代币对', 'INVALID_TOKEN_PAIR');
    }

    const decimalsA = APP_CONFIG.DECIMALS[tokenA as keyof typeof APP_CONFIG.DECIMALS] || 18;
    const decimalsB = APP_CONFIG.DECIMALS[tokenB as keyof typeof APP_CONFIG.DECIMALS] || 18;

    const liquidityBN = ethers.parseUnits(liquidity.toString(), 18);

    const amountAMinBN = ethers.parseUnits('0', decimalsA);
    const amountBMinBN = ethers.parseUnits('0', decimalsB);

    const receipt = await routerContract.removeLiquidity(
      tokenAAddress,
      tokenBAddress,
      liquidityBN,
      amountAMinBN,
      amountBMinBN,
      to,
      deadline
    );

    return {
      txHash: receipt.hash,
      amountIn: liquidity.toString(),
      amountOut: '0',
      amountOutMin: '0',
      path: [tokenAAddress, tokenBAddress],
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('执行移除流动性失败:', error);
    throw new ContractServiceError('执行移除流动性失败', 'EXECUTE_REMOVE_LIQUIDITY_FAILED');
  }
};

/**
 * 执行 Uniswap 交易
 * @param pair 交易对（格式：'BASE-QUOTE'）
 * @param type 交易类型（'buy' 或 'sell'）
 * @param amount 交易金额
 * @param price 交易价格
 * @param userAddress 用户地址
 * @returns 交易详情
 * @throws {ContractServiceError} 当执行 Uniswap 交易失败时
 */
export const executeUniswapTrade = async (
  pair: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number,
  userAddress: string
): Promise<any> => {
  try {
    const [baseToken, quoteToken] = pair.split('-');
    const inputToken = type === 'buy' ? quoteToken : baseToken;
    const outputToken = type === 'buy' ? baseToken : quoteToken;
    
    const result = await executeTrade('uniswap', inputToken, outputToken, amount, {
      recipient: userAddress
    });
    
    const total = parseFloat(result.amountOut) * price;
    const fee = total * APP_CONFIG.DEFAULT_TRADE_FEE;
    
    return {
      id: result.txHash,
      user: userAddress,
      pair,
      type,
      amount,
      price,
      total,
      fee,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
  } catch (error) {
    console.error('执行Uniswap交易失败:', error);
    throw new ContractServiceError('执行Uniswap交易失败', 'EXECUTE_UNISWAP_TRADE_FAILED');
  }
};
