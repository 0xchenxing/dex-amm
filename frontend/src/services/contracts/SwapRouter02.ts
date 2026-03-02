import { ethers } from 'ethers';
import type {
  BigNumberish,
  ContractTransactionResponse,
  Signer,
  Provider,
  BytesLike,
  Overrides,
} from 'ethers';

export class SwapRouter02 {
  public readonly contract: ethers.Contract;
  public readonly address: string;
  public readonly signerOrProvider: Signer | Provider;

  constructor(address: string, signerOrProvider: Signer | Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    this.contract = new ethers.Contract(address, ABI, signerOrProvider);
  }

  public connect(addressOrSigner: string | Signer): SwapRouter02 {
    if (typeof addressOrSigner === 'string') {
      return new SwapRouter02(addressOrSigner, this.signerOrProvider);
    } else {
      return new SwapRouter02(this.address, addressOrSigner);
    }
  }

  public async factory(overrides?: Overrides): Promise<string> {
    return (await this.contract.factory(overrides)) as string;
  }

  public async WETH(overrides?: Overrides): Promise<string> {
    return (await this.contract.WETH(overrides)) as string;
  }

  public async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.addLiquidity(
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      to,
      deadline,
      overrides || {}
    );
  }

  public async addLiquidityETH(
    token: string,
    amountTokenDesired: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.addLiquidityETH(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides
    );
  }

  public async removeLiquidity(
    tokenA: string,
    tokenB: string,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline,
      overrides || {}
    );
  }

  public async removeLiquidityETH(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidityETH(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides || {}
    );
  }

  public async removeLiquidityWithPermit(
    tokenA: string,
    tokenB: string,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    approveMax: boolean,
    v: number,
    r: BytesLike,
    s: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidityWithPermit(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline,
      approveMax,
      v,
      r,
      s,
      overrides || {}
    );
  }

  public async removeLiquidityETHWithPermit(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    approveMax: boolean,
    v: number,
    r: BytesLike,
    s: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidityETHWithPermit(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      approveMax,
      v,
      r,
      s,
      overrides || {}
    );
  }

  public async removeLiquidityETHSupportingFeeOnTransferTokens(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidityETHSupportingFeeOnTransferTokens(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides || {}
    );
  }

  public async removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    approveMax: boolean,
    v: number,
    r: BytesLike,
    s: BytesLike,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      approveMax,
      v,
      r,
      s,
      overrides || {}
    );
  }

  public async swapExactTokensForTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async swapTokensForExactTokens(
    amountOut: BigNumberish,
    amountInMax: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapTokensForExactTokens(
      amountOut,
      amountInMax,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async swapExactETHForTokens(
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      overrides
    );
  }

  public async swapExactTokensForETH(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async swapTokensForExactETH(
    amountOut: BigNumberish,
    amountInMax: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapTokensForExactETH(
      amountOut,
      amountInMax,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async swapETHForExactTokens(
    amountOut: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapETHForExactTokens(
      amountOut,
      path,
      to,
      deadline,
      overrides
    );
  }

  public async swapExactTokensForTokensSupportingFeeOnTransferTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async swapExactETHForTokensSupportingFeeOnTransferTokens(
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOutMin,
      path,
      to,
      deadline,
      overrides
    );
  }

  public async swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<ContractTransactionResponse> {
    return await this.contract.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
  }

  public async quote(
    amountA: BigNumberish,
    reserveA: BigNumberish,
    reserveB: BigNumberish,
    overrides?: Overrides
  ): Promise<bigint> {
    return (await this.contract.quote(amountA, reserveA, reserveB, overrides)) as bigint;
  }

  public async getAmountOut(
    amountIn: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish,
    overrides?: Overrides
  ): Promise<bigint> {
    return (await this.contract.getAmountOut(amountIn, reserveIn, reserveOut, overrides)) as bigint;
  }

  public async getAmountIn(
    amountOut: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish,
    overrides?: Overrides
  ): Promise<bigint> {
    return (await this.contract.getAmountIn(amountOut, reserveIn, reserveOut, overrides)) as bigint;
  }

  public async getAmountsOut(
    amountIn: BigNumberish,
    path: string[],
    overrides?: Overrides
  ): Promise<bigint[]> {
    return (await this.contract.getAmountsOut(amountIn, path, overrides)) as bigint[];
  }

  public async getAmountsIn(
    amountOut: BigNumberish,
    path: string[],
    overrides?: Overrides
  ): Promise<bigint[]> {
    return (await this.contract.getAmountsIn(amountOut, path, overrides)) as bigint[];
  }
}

const ABI = [
  'function factory() external view returns (address)',
  'function WETH() external view returns (address)',

  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',
  'function removeLiquidityWithPermit(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETHWithPermit(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountToken, uint amountETH)',
  'function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountETH)',
  'function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountETH)',

  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',

  'function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)',
  'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
  'function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)',
];
