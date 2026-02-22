import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../config/contracts';

let ethereumProvider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let currentNetwork: ethers.Network | null = null;

/**
 * 合约服务错误类
 * 用于处理与以太坊合约交互相关的错误
 */
export class ContractServiceError extends Error {
  /**
   * 构造函数
   * @param message 错误消息
   * @param code 错误代码
   */
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ContractServiceError';
  }
}

/**
 * 连接到以太坊网络
 * 请求用户授权并初始化以太坊提供商
 * @returns 以太坊浏览器提供商实例
 * @throws {ContractServiceError} 当未检测到钱包或连接失败时
 */
export const connectToEthereum = async (): Promise<ethers.BrowserProvider> => {
  if (typeof window.ethereum === 'undefined') {
    throw new ContractServiceError('未检测到以太坊钱包 (MetaMask)', 'NO_WALLET');
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    ethereumProvider = new ethers.BrowserProvider(window.ethereum);
    signer = await ethereumProvider.getSigner();
    currentNetwork = await ethereumProvider.getNetwork();
    
    console.log('成功连接到以太坊网络:', currentNetwork.name);
    return ethereumProvider;
  } catch (error) {
    console.error('连接以太坊失败:', error);
    throw new ContractServiceError('连接以太坊失败', 'CONNECTION_FAILED');
  }
};

/**
 * 获取以太坊提供商实例
 * 如果尚未初始化，则自动连接到以太坊网络
 * @returns 以太坊浏览器提供商实例
 */
export const getProvider = async (): Promise<ethers.BrowserProvider> => {
  if (!ethereumProvider) {
    return await connectToEthereum();
  }
  return ethereumProvider;
};

/**
 * 获取以太坊签名者实例
 * 如果尚未初始化，则自动连接到以太坊网络
 * @returns 以太坊签名者实例
 * @throws {ContractServiceError} 当无法获取签名者时
 */
export const getSigner = async (): Promise<ethers.Signer> => {
  if (!signer) {
    await connectToEthereum();
  }
  if (!signer) {
    throw new ContractServiceError('无法获取签名者', 'NO_SIGNER');
  }
  return signer;
};

/**
 * 获取当前连接的以太坊账户地址
 * @returns 当前账户地址
 * @throws {ContractServiceError} 当获取账户地址失败时
 */
export const getAccountAddress = async (): Promise<string> => {
  const signerInstance = await getSigner();
  try {
    return await signerInstance.getAddress();
  } catch (error) {
    console.error('获取账户地址失败:', error);
    throw new ContractServiceError('获取账户地址失败', 'GET_ADDRESS_FAILED');
  }
};

/**
 * 获取当前连接的以太坊网络信息
 * 如果尚未初始化，则自动获取网络信息
 * @returns 当前网络信息
 */
export const getNetwork = async (): Promise<ethers.Network> => {
  if (!currentNetwork) {
    const provider = await getProvider();
    currentNetwork = await provider.getNetwork();
  }
  return currentNetwork;
};

/**
 * 检查当前网络是否被支持
 * @returns 当前网络是否被支持
 */
export const isNetworkSupported = async (): Promise<boolean> => {
  const network = await getNetwork();
  // 支持的网络ID: Sepolia (11155111)
  const supportedNetworks = [11155111];
  return supportedNetworks.includes(Number(network.chainId));
};

/**
 * 创建以太坊合约实例
 * @param address 合约地址
 * @param abi 合约ABI
 * @returns 合约实例
 */
export const createContract = async <T extends ethers.Contract>(
  address: string,
  abi: ethers.InterfaceAbi
): Promise<T> => {
  const signerInstance = await getSigner();
  return new ethers.Contract(address, abi, signerInstance) as T;
};

/**
 * 监听账户变化事件
 * @param callback 账户变化时的回调函数
 */
export const listenForAccountChanges = (callback: (accounts: string[]) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * 移除账户变化事件监听器
 * @param callback 要移除的回调函数
 */
export const removeAccountChangesListener = (callback: (accounts: string[]) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeListener('accountsChanged', callback);
  }
};

// 存储网络变化监听器的映射，用于后续移除
const networkChangeListeners = new Map<(network: ethers.Network) => void, (chainId: string) => void>();

/**
 * 监听网络变化事件
 * @param callback 网络变化时的回调函数
 */
export const listenForNetworkChanges = (callback: (network: ethers.Network) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    // 创建并存储监听器函数
    const listener = (chainId: string) => {
      getProvider().then(async (provider) => {
        currentNetwork = await provider.getNetwork();
        callback(currentNetwork);
      });
    };
    
    networkChangeListeners.set(callback, listener);
    window.ethereum.on('chainChanged', listener);
  }
};

/**
 * 移除网络变化事件监听器
 * @param callback 要移除的回调函数
 */
export const removeNetworkChangesListener = (callback: (network: ethers.Network) => void) => {
  if (typeof window.ethereum !== 'undefined') {
    // 获取并移除存储的监听器函数
    const listener = networkChangeListeners.get(callback);
    if (listener) {
      window.ethereum.removeListener('chainChanged', listener);
      networkChangeListeners.delete(callback);
    }
  }
};

/**
 * 获取当前网络的燃气价格
 * @returns 当前燃气价格
 */
export const getGasPrice = async (): Promise<ethers.BigNumberish> => {
  const provider = await getProvider();
  const feeData = await provider.getFeeData();
  return feeData.gasPrice ?? feeData.maxFeePerGas ?? 0;
};

/**
 * 估算交易的燃气消耗
 * @param tx 交易请求对象
 * @returns 估算的燃气消耗
 */
export const estimateGas = async (
  tx: ethers.TransactionRequest
): Promise<ethers.BigNumberish> => {
  const provider = await getProvider();
  return await provider.estimateGas(tx);
};
