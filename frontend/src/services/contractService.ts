import { BrowserProvider, Signer } from 'ethers';
import * as erc20Service from './contracts/ERC20';
import * as routerService from './contracts/SwapRouter02';
import * as factoryService from './contracts/SwapFactory';
import * as governorService from './contracts/SimpleGovernor';

export * from './contracts/ERC20';
export * from './contracts/SwapRouter02';
export * from './contracts/SwapFactory';
export * from './contracts/SimpleGovernor';

export async function getSigner(): Promise<Signer> {
  if (!window.ethereum) {
    throw new Error('请安装 MetaMask 钱包');
  }
  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return signer;
}

export default {
  ...erc20Service,
  ...routerService,
  ...factoryService,
  ...governorService,
};
