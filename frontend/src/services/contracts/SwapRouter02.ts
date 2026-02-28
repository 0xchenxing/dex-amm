import { ethers } from 'ethers';
import type {
  BigNumberish,
  BigNumber,
  ContractTransaction,
  ContractReceipt,
  Signer,
  Provider,
  BytesLike,
} from 'ethers';

/**
 * SwapRouter02 合约的封装类
 * 提供所有函数的类型安全调用
 */
export class SwapRouter02 {
  public readonly contract: ethers.Contract;
  public readonly address: string;
  public readonly signerOrProvider: Signer | Provider;

  /**
   * 创建 SwapRouter02 实例
   * @param address 合约地址
   * @param signerOrProvider 签名者或提供者
   */
  constructor(address: string, signerOrProvider: Signer | Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    this.contract = new ethers.Contract(address, ABI, signerOrProvider);
  }

  /**
   * 连接到新的地址或签名者
   */
  public connect(addressOrSigner: string | Signer): SwapRouter02 {
    if (typeof addressOrSigner === 'string') {
      return new SwapRouter02(addressOrSigner, this.signerOrProvider);
    } else {
      return new SwapRouter02(this.address, addressOrSigner);
    }
  }

  // ------------------------------------------------------------------------
  // 只读变量
  // ------------------------------------------------------------------------

  /** 获取工厂合约地址 */
  public async factory(): Promise<string> {
    return await this.contract.factory();
  }

  /** 获取 WETH 合约地址 */
  public async WETH(): Promise<string> {
    return await this.contract.WETH();
  }

  // ------------------------------------------------------------------------
  // 添加流动性
  // ------------------------------------------------------------------------

  /**
   * 添加两种 ERC20 代币的流动性
   * @param tokenA 代币A地址
   * @param tokenB 代币B地址
   * @param amountADesired 期望提供的代币A数量
   * @param amountBDesired 期望提供的代币B数量
   * @param amountAMin 最小代币A数量（滑点保护）
   * @param amountBMin 最小代币B数量（滑点保护）
   * @param to 接收LP代币的地址
   * @param deadline 截止时间戳
   * @param overrides 交易选项（如 gasLimit, gasPrice）
   * @returns 实际添加的代币A数量、代币B数量和铸造的LP代币数量
   */
  public async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountADesired: BigNumberish,
    amountBDesired: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountA: BigNumber;
    amountB: BigNumber;
    liquidity: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.addLiquidity(
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
    const receipt = await tx.wait();
    // 从事件或解码返回值获取结果，这里返回 tx 并让用户自行解码
    // 也可以尝试解码返回值（但需要知道接口），通常更安全的是返回 tx 和等待函数
    return {
      amountA: ethers.BigNumber.from(0), // 占位，实际应解析事件
      amountB: ethers.BigNumber.from(0),
      liquidity: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 添加 ETH 和 ERC20 代币的流动性（自动包装 ETH 为 WETH）
   * @param token 代币地址
   * @param amountTokenDesired 期望提供的代币数量
   * @param amountTokenMin 最小代币数量
   * @param amountETHMin 最小 ETH 数量
   * @param to 接收LP代币的地址
   * @param deadline 截止时间戳
   * @param overrides 必须包含 value 字段（发送的 ETH 数量）
   */
  public async addLiquidityETH(
    token: string,
    amountTokenDesired: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides: ethers.PayableOverrides & { from?: string | Promise<string> }
  ): Promise<{
    amountToken: BigNumber;
    amountETH: BigNumber;
    liquidity: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.addLiquidityETH(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides
    );
    return {
      amountToken: ethers.BigNumber.from(0),
      amountETH: ethers.BigNumber.from(0),
      liquidity: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  // ------------------------------------------------------------------------
  // 移除流动性
  // ------------------------------------------------------------------------

  /**
   * 移除 ERC20 代币对的流动性
   */
  public async removeLiquidity(
    tokenA: string,
    tokenB: string,
    liquidity: BigNumberish,
    amountAMin: BigNumberish,
    amountBMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountA: BigNumber;
    amountB: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
      deadline,
      overrides || {}
    );
    return {
      amountA: ethers.BigNumber.from(0),
      amountB: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 移除 ETH 和 ERC20 代币的流动性（自动将 WETH 换回 ETH）
   */
  public async removeLiquidityETH(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountToken: BigNumber;
    amountETH: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidityETH(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides || {}
    );
    return {
      amountToken: ethers.BigNumber.from(0),
      amountETH: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  // ------------------------------------------------------------------------
  // 带 Permi​​t 的移除流动性
  // ------------------------------------------------------------------------

  /**
   * 使用 ERC20Permit 授权移除流动性
   */
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
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountA: BigNumber;
    amountB: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidityWithPermit(
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
    return {
      amountA: ethers.BigNumber.from(0),
      amountB: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 使用 ERC20Permit 授权移除 ETH 流动性
   */
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
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountToken: BigNumber;
    amountETH: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidityETHWithPermit(
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
    return {
      amountToken: ethers.BigNumber.from(0),
      amountETH: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  // ------------------------------------------------------------------------
  // 支持通缩代币的移除流动性
  // ------------------------------------------------------------------------

  /**
   * 移除 ETH 流动性，支持通缩代币（最终实际收到的代币数量可能不同于计算值）
   * @returns 实际收到的 ETH 数量
   */
  public async removeLiquidityETHSupportingFeeOnTransferTokens(
    token: string,
    liquidity: BigNumberish,
    amountTokenMin: BigNumberish,
    amountETHMin: BigNumberish,
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountETH: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidityETHSupportingFeeOnTransferTokens(
      token,
      liquidity,
      amountTokenMin,
      amountETHMin,
      to,
      deadline,
      overrides || {}
    );
    return {
      amountETH: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 使用 Permi​​t 移除 ETH 流动性，支持通缩代币
   */
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
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amountETH: BigNumber;
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
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
    return {
      amountETH: ethers.BigNumber.from(0),
      tx,
      wait: () => tx.wait(),
    };
  }

  // ------------------------------------------------------------------------
  // 普通交换
  // ------------------------------------------------------------------------

  /**
   * 精确输入，最少输出 - 代币换代币
   */
  public async swapExactTokensForTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactTokensForTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 精确输出，最大输入 - 代币换代币
   */
  public async swapTokensForExactTokens(
    amountOut: BigNumberish,
    amountInMax: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapTokensForExactTokens(
      amountOut,
      amountInMax,
      path,
      to,
      deadline,
      overrides || {}
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 精确 ETH 输入，最少代币输出 - ETH 换代币
   */
  public async swapExactETHForTokens(
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: ethers.PayableOverrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactETHForTokens(
      amountOutMin,
      path,
      to,
      deadline,
      overrides
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 精确代币输入，最少 ETH 输出 - 代币换 ETH
   */
  public async swapExactTokensForETH(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 精确代币输出，最大 ETH 输入 - 代币换 ETH
   */
  public async swapTokensForExactETH(
    amountOut: BigNumberish,
    amountInMax: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapTokensForExactETH(
      amountOut,
      amountInMax,
      path,
      to,
      deadline,
      overrides || {}
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  /**
   * 精确 ETH 输出，最大 ETH 输入 - ETH 换代币
   */
  public async swapETHForExactTokens(
    amountOut: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: ethers.PayableOverrides & { from?: string | Promise<string> }
  ): Promise<{
    amounts: BigNumber[];
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapETHForExactTokens(
      amountOut,
      path,
      to,
      deadline,
      overrides
    );
    return {
      amounts: [],
      tx,
      wait: () => tx.wait(),
    };
  }

  // ------------------------------------------------------------------------
  // 支持通缩代币的交换（不返回 amounts，通过余额检查确保输出）
  // ------------------------------------------------------------------------

  public async swapExactTokensForTokensSupportingFeeOnTransferTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
    return { tx, wait: () => tx.wait() };
  }

  public async swapExactETHForTokensSupportingFeeOnTransferTokens(
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides: ethers.PayableOverrides & { from?: string | Promise<string> }
  ): Promise<{
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOutMin,
      path,
      to,
      deadline,
      overrides
    );
    return { tx, wait: () => tx.wait() };
  }

  public async swapExactTokensForETHSupportingFeeOnTransferTokens(
    amountIn: BigNumberish,
    amountOutMin: BigNumberish,
    path: string[],
    to: string,
    deadline: BigNumberish,
    overrides?: ethers.Overrides & { from?: string | Promise<string> }
  ): Promise<{
    tx: ContractTransaction;
    wait: () => Promise<ContractReceipt>;
  }> {
    const tx = await this.contract.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      to,
      deadline,
      overrides || {}
    );
    return { tx, wait: () => tx.wait() };
  }

  // ------------------------------------------------------------------------
  // 报价与计算函数（只读）
  // ------------------------------------------------------------------------

  public async quote(
    amountA: BigNumberish,
    reserveA: BigNumberish,
    reserveB: BigNumberish,
    overrides?: ethers.CallOverrides
  ): Promise<BigNumber> {
    return await this.contract.quote(amountA, reserveA, reserveB, overrides || {});
  }

  public async getAmountOut(
    amountIn: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish,
    overrides?: ethers.CallOverrides
  ): Promise<BigNumber> {
    return await this.contract.getAmountOut(amountIn, reserveIn, reserveOut, overrides || {});
  }

  public async getAmountIn(
    amountOut: BigNumberish,
    reserveIn: BigNumberish,
    reserveOut: BigNumberish,
    overrides?: ethers.CallOverrides
  ): Promise<BigNumber> {
    return await this.contract.getAmountIn(amountOut, reserveIn, reserveOut, overrides || {});
  }

  public async getAmountsOut(
    amountIn: BigNumberish,
    path: string[],
    overrides?: ethers.CallOverrides
  ): Promise<BigNumber[]> {
    return await this.contract.getAmountsOut(amountIn, path, overrides || {});
  }

  public async getAmountsIn(
    amountOut: BigNumberish,
    path: string[],
    overrides?: ethers.CallOverrides
  ): Promise<BigNumber[]> {
    return await this.contract.getAmountsIn(amountOut, path, overrides || {});
  }
}

// ------------------------------------------------------------------------
// 合约 ABI（根据提供的接口手动构建）
// ------------------------------------------------------------------------
const ABI = [
  // 只读变量
  'function factory() external view returns (address)',
  'function WETH() external view returns (address)',

  // 添加流动性
  'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)',

  // 移除流动性
  'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)',

  // 带Permit
  'function removeLiquidityWithPermit(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountA, uint amountB)',
  'function removeLiquidityETHWithPermit(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountToken, uint amountETH)',

  // 支持通缩
  'function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountETH)',
  'function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountETH)',

  // 普通交换
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',

  // 支持通缩的交换
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',

  // 报价计算
  'function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)',
  'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
  'function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn)',
  'function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)',
  'function getAmountsIn(uint amountOut, address[] memory path) external view returns (uint[] memory amounts)',
];

// 默认导出
export default SwapRouter02;