import {
  Contract,
  Signer,
  Provider,
  ContractTransactionResponse,
  ContractTransactionReceipt,
  Overrides,
  BigNumberish,
} from 'ethers';

/**
 * SwapFactory 合约封装类 (兼容 ethers v6)
 * 提供所有函数的类型安全调用
 */
export class SwapFactory {
  public readonly contract: Contract;
  public readonly address: string;
  public readonly signerOrProvider: Signer | Provider;

  constructor(address: string, signerOrProvider: Signer | Provider) {
    this.address = address;
    this.signerOrProvider = signerOrProvider;
    this.contract = new Contract(address, ABI, signerOrProvider);
  }

  /**
   * 连接到新的签名者或提供者
   */
  public connect(addressOrSigner: string | Signer): SwapFactory {
    if (typeof addressOrSigner === 'string') {
      return new SwapFactory(addressOrSigner, this.signerOrProvider);
    } else {
      return new SwapFactory(this.address, addressOrSigner);
    }
  }

  // ------------------------------------------------------------------------
  // 只读状态变量
  // ------------------------------------------------------------------------

  public async feeTo(overrides?: Overrides): Promise<string> {
    return (await this.contract.feeTo(overrides)) as string;
  }

  public async feeToSetter(overrides?: Overrides): Promise<string> {
    return (await this.contract.feeToSetter(overrides)) as string;
  }

  public async getPair(
    tokenA: string,
    tokenB: string,
    overrides?: Overrides
  ): Promise<string> {
    return (await this.contract.getPair(tokenA, tokenB, overrides)) as string;
  }

  public async allPairs(
    index: BigNumberish,
    overrides?: Overrides
  ): Promise<string> {
    return (await this.contract.allPairs(index, overrides)) as string;
  }

  public async allPairsLength(overrides?: Overrides): Promise<bigint> {
    return (await this.contract.allPairsLength(overrides)) as bigint;
  }

  // ------------------------------------------------------------------------
  // 交易函数
  // ------------------------------------------------------------------------

  public async createPair(
    tokenA: string,
    tokenB: string,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.createPair(tokenA, tokenB, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  public async setFeeTo(
    _feeTo: string,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.setFeeTo(_feeTo, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  public async setFeeToSetter(
    _feeToSetter: string,
    overrides?: Overrides & { from?: string }
  ): Promise<{
    tx: ContractTransactionResponse;
    wait: () => Promise<ContractTransactionReceipt>;
  }> {
    const tx = await this.contract.setFeeToSetter(_feeToSetter, overrides || {});
    return { tx, wait: () => tx.wait() };
  }

  // ------------------------------------------------------------------------
  // 事件过滤器
  // ------------------------------------------------------------------------

  public filters = {
    PairCreated: (
      token0?: string | null,
      token1?: string | null,
      pair?: string | null
    ) => {
      return this.contract.filters.PairCreated(token0, token1, pair);
    },
  };
}

// ------------------------------------------------------------------------
// 合约 ABI（根据合约代码构建）
// ------------------------------------------------------------------------
const ABI = [
  // 状态变量 getter
  'function feeTo() external view returns (address)',
  'function feeToSetter() external view returns (address)',
  'function getPair(address, address) external view returns (address)',
  'function allPairs(uint256) external view returns (address)',
  'function allPairsLength() external view returns (uint)',

  // 交易函数
  'function createPair(address tokenA, address tokenB) external returns (address pair)',
  'function setFeeTo(address _feeTo) external',
  'function setFeeToSetter(address _feeToSetter) external',

  // 事件
  'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
];

export default SwapFactory;