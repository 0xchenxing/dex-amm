import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, APP_CONFIG } from '../config/contracts';
import type { Trade } from '../types';

let ethereumProvider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;

export const connectToEthereum = async (): Promise<ethers.BrowserProvider | null> => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      ethereumProvider = new ethers.BrowserProvider(window.ethereum);
      signer = await ethereumProvider.getSigner();
      return ethereumProvider;
    } catch (error) {
      console.error('连接以太坊失败:', error);
      return null;
    }
  } else {
    console.error('未检测到以太坊钱包 (MetaMask)');
    return null;
  }
};

export const getAccountAddress = async (): Promise<string | null> => {
  if (!signer) {
    await connectToEthereum();
  }
  
  if (signer) {
    try {
      return await signer.getAddress();
    } catch (error) {
      console.error('获取账户地址失败:', error);
      return null;
    }
  }
  
  return null;
};

const getTokenContract = (tokenAddress: string): ethers.Contract | null => {
  if (!signer) return null;
  return new ethers.Contract(tokenAddress, CONTRACT_ABIS.ERC20, signer);
};

export const getUniswapRouterContract = (): ethers.Contract | null => {
  if (!signer) return null;
  return new ethers.Contract(
    CONTRACT_ADDRESSES.UNISWAP_ROUTER,
    CONTRACT_ABIS.UNISWAP_ROUTER,
    signer
  );
};

const getTradePath = (inputToken: string, outputToken: string): string[] => {
  const { TOKENS } = CONTRACT_ADDRESSES;
  return [TOKENS[inputToken as keyof typeof TOKENS], TOKENS[outputToken as keyof typeof TOKENS]];
};

export const executeUniswapTrade = async (
  pair: string,
  type: 'buy' | 'sell',
  amount: number,
  price: number,
  userAddress: string
): Promise<Trade | null> => {
  try {
    if (!ethereumProvider || !signer) {
      await connectToEthereum();
    }
    
    if (!ethereumProvider || !signer) {
      console.error('未连接到以太坊钱包');
      return null;
    }
    
    const [baseToken, quoteToken] = pair.split('-');
    const routerContract = getUniswapRouterContract();
    
    if (!routerContract) {
      console.error('获取Uniswap Router合约失败');
      return null;
    }
    
    const inputToken = type === 'buy' ? quoteToken : baseToken;
    const outputToken = type === 'buy' ? baseToken : quoteToken;
    
    const inputTokenAddress = CONTRACT_ADDRESSES.TOKENS[inputToken as keyof typeof CONTRACT_ADDRESSES.TOKENS];
    const inputDecimals = APP_CONFIG.DECIMALS[inputToken as keyof typeof APP_CONFIG.DECIMALS];
    const outputDecimals = APP_CONFIG.DECIMALS[outputToken as keyof typeof APP_CONFIG.DECIMALS];
    
    const inputAmount = type === 'buy' ? amount * price : amount;
    const inputAmountWei = ethers.parseUnits(inputAmount.toString(), inputDecimals);
    
    const path = getTradePath(inputToken, outputToken);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const slippageTolerance = 0.01;
    
    const amounts = await routerContract.getAmountsOut(inputAmountWei, path);
    const outputAmountWei = amounts[amounts.length - 1];
    const minOutputAmountWei = outputAmountWei * BigInt(Math.floor((1 - slippageTolerance) * 1e18)) / BigInt(1e18);
    
    const inputTokenContract = getTokenContract(inputTokenAddress);
    if (!inputTokenContract) {
      console.error('获取输入代币合约失败');
      return null;
    }
    
    const allowance = await inputTokenContract.allowance(userAddress, CONTRACT_ADDRESSES.UNISWAP_ROUTER);
    if (allowance < inputAmountWei) {
      const approveTx = await inputTokenContract.approve(
        CONTRACT_ADDRESSES.UNISWAP_ROUTER,
        ethers.MaxUint256
      );
      await approveTx.wait();
      console.log('代币授权成功');
    }
    
    const tradeTx = await routerContract.swapExactTokensForTokens(
      inputAmountWei,
      minOutputAmountWei,
      path,
      userAddress,
      deadline
    );
    
    const receipt = await tradeTx.wait();
    const actualOutputAmountWei = amounts[amounts.length - 1];
    const actualOutputAmount = ethers.formatUnits(actualOutputAmountWei, outputDecimals);
    
    const total = parseFloat(actualOutputAmount) * price;
    const fee = total * APP_CONFIG.DEFAULT_TRADE_FEE;
    
    const newTrade: Trade = {
      id: receipt.hash,
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
    
    return newTrade;
  } catch (error) {
    console.error('执行Uniswap交易失败:', error);
    return null;
  }
};

export const listenForAccountChanges = (callback: (accounts: string[]) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback);
  }
};

export const removeAccountChangesListener = (callback: (accounts: string[]) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeListener('accountsChanged', callback);
  }
};

