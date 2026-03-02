import {
  Contract,
  Signer,
  Provider,
  ContractTransactionResponse,
  ContractTransactionReceipt,
  Overrides,
  BigNumberish,
  Interface,
  Log,
  EventLog,
} from 'ethers';

/**
 * 标准 ERC20 代币合约封装类 (兼容 ethers v6)
 * 提供所有标准 ERC20 函数的类型安全调用
 */
export class ERC20 {
  public readonly contract: Contract;
  public readonly address: string;
  public readonly signerOrProvider: Signer | Provider;
  public readonly interface: Interface;

  constructor(address: string, signerOrProvider: Signer | Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    this.contract = new Contract(address, ABI, signerOrProvider);
    this.interface = this.contract.interface;
  }

  /**
   * 连接到新的签名者或提供者
   */
  public connect(addressOrSigner: string | Signer): ERC20 {
    if (typeof addressOrSigner === 'string') {
      return new ERC20(addressOrSigner, this.signerOrProvider);
    } else {
      return new ERC20(this.address, addressOrSigner);
    }
  }

  // ------------------------------------------------------------------------
  // 只读函数 (视图)
  // ------------------------------------------------------------------------

  /**
   * 返回代币名称
   */
  public async name(): Promise<string> {
    return (await this.contract.name()) as string;
  }

  /**
   * 返回代币符号
   */
  public async symbol(): Promise<string> {
    return (await this.contract.symbol()) as string;
  }

  /**
   * 返回代币小数位数
   */
  public async decimals(): Promise<number> {
    return Number(await this.contract.decimals());
  }

  /**
   * 返回代币总供应量
   */
  public async totalSupply(): Promise<bigint> {
    return (await this.contract.totalSupply()) as bigint;
  }

  /**
   * 返回指定地址的代币余额
   * @param account 账户地址
   */
  public async balanceOf(account: string): Promise<bigint> {
    return (await this.contract.balanceOf(account)) as bigint;
  }

  /**
   * 返回 owner 授权给 spender 的额度
   * @param owner 所有者地址
   * @param spender 被授权地址
   */
  public async allowance(
    owner: string,
    spender: string
  ): Promise<bigint> {
    return (await this.contract.allowance(owner, spender)) as bigint;
  }

  // ------------------------------------------------------------------------
  // 交易函数
  // ------------------------------------------------------------------------

  /**
   * 转账代币到指定地址
   * @param to 接收地址
   * @param amount 转账数量
   */
  public async transfer(
    to: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.transfer(to, amount, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  /**
   * 授权 spender 可从发送方账户转账 amount 数量的代币
   * @param spender 被授权地址
   * @param amount 授权数量
   */
  public async approve(
    spender: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.approve(spender, amount, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  /**
   * 从 from 转账代币到 to（需要调用者拥有足够的授权）
   * @param from 源地址
   * @param to 目标地址
   * @param amount 转账数量
   */
  public async transferFrom(
    from: string,
    to: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.transferFrom(from, to, amount, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  // ------------------------------------------------------------------------
  // 可选扩展 (部分 ERC20 实现包含)
  // ------------------------------------------------------------------------

  /**
   * 增加授权额度（安全地增加 allowance，防止竞争条件）
   * @param spender 被授权地址
   * @param addedValue 增加的数量
   */
  public async increaseAllowance(
    spender: string,
    addedValue: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.increaseAllowance(spender, addedValue, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  /**
   * 减少授权额度
   * @param spender 被授权地址
   * @param subtractedValue 减少的数量
   */
  public async decreaseAllowance(
    spender: string,
    subtractedValue: BigNumberish,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.decreaseAllowance(spender, subtractedValue, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  // ------------------------------------------------------------------------
  // 事件过滤器
  // ------------------------------------------------------------------------

  public filters = {
    /**
     * Transfer 事件过滤器
     * @param from 源地址（可为 null 以匹配任意）
     * @param to 目标地址（可为 null 以匹配任意）
     */
    Transfer: (from?: string | null, to?: string | null) => {
      return this.contract.filters.Transfer(from, to);
    },

    /**
     * Approval 事件过滤器
     * @param owner 所有者地址（可为 null 以匹配任意）
     * @param spender 被授权地址（可为 null 以匹配任意）
     */
    Approval: (owner?: string | null, spender?: string | null) => {
      return this.contract.filters.Approval(owner, spender);
    },
  };

  // ------------------------------------------------------------------------
  // 辅助方法：解析事件日志
  // ------------------------------------------------------------------------

  /**
   * 从交易收据中解析 Transfer 事件
   * @param receipt 交易收据
   * @param eventName 事件名称，默认为 'Transfer'
   * @returns 解析后的事件数组
   */
  public parseEvents(
    receipt: ContractTransactionReceipt,
    eventName: 'Transfer' | 'Approval'
  ): Array<{ from: string; to: string; value: bigint } | { owner: string; spender: string; value: bigint }> {
    const logs = receipt.logs
      .filter((log) => log.address.toLowerCase() === this.address.toLowerCase())
      .map((log) => {
        try {
          return this.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .filter((parsed) => parsed && parsed.name === eventName);

    if (eventName === 'Transfer') {
      return logs.map((parsed) => ({
        from: parsed!.args[0],
        to: parsed!.args[1],
        value: parsed!.args[2],
      })) as any;
    } else {
      return logs.map((parsed) => ({
        owner: parsed!.args[0],
        spender: parsed!.args[1],
        value: parsed!.args[2],
      })) as any;
    }
  }
}

// ------------------------------------------------------------------------
// 标准 ERC20 ABI (包含可选方法)
// ------------------------------------------------------------------------
const ABI = [
  // 视图函数
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',

  // 交易函数
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',

  // 可选扩展 (OpenZeppelin ERC20 常用)
  'function increaseAllowance(address spender, uint256 addedValue) external returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool)',

  // 事件
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

export default ERC20;