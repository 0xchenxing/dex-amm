import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolAPI } from '../services/apiService';
import { getSigner, ERC20, SwapRouter02 } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Contract, ZeroAddress } from 'ethers';
import type { LiquidityPool } from '../types';
import { formatUnits, parseUnits } from 'ethers';
import './TraderDashboard.css';

/** 资产组合中的代币信息 */
interface PortfolioToken {
  symbol: string;
  balance: number;
  decimals: number;
  valueUsdt: number;
  priceUsdt: number;
  change24h: number | null;
  proportion: number;
}

/** 链上交易记录 */
interface ChainTrade {
  txHash: string;
  timestamp: number;
  pairId: string;
  pairLabel: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  fee: number;
  tokenIn: string;
  tokenOut: string;
}

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '交易概览', icon: '📊' },
  { key: 'trading', label: '现货交易', icon: '💱' },
  { key: 'portfolio', label: '资产组合', icon: '💼' },
  { key: 'history', label: '交易历史', icon: '📜' },
];

export function TraderDashboard() {
  useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [portfolioTokens, setPortfolioTokens] = useState<PortfolioToken[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [totalAssetValue, setTotalAssetValue] = useState(0);
  const [poolsSyncing, setPoolsSyncing] = useState(false);

  const [buyPair, setBuyPair] = useState('ETH-USDT');
  const [buyAmount, setBuyAmount] = useState('');
  const [sellPair, setSellPair] = useState('ETH-USDT');
  const [sellAmount, setSellAmount] = useState('');

  const [chainTrades, setChainTrades] = useState<ChainTrade[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    loadData();
    connectToMetaMask();
  }, []);

  useEffect(() => {
    if (activeSection === 'orders') setActiveSection('trading');
  }, [activeSection]);

  const connectToMetaMask = async () => {
    try {
      if (!window.ethereum) {
        showNotification('请安装 MetaMask 钱包', 'error');
        return;
      }
      const signer = await getSigner();
      const address = await signer.getAddress();
      if (address) {
        setEthereumAddress(address);
        setIsConnected(true);
        showNotification('成功连接到MetaMask', 'success');
      }
    } catch (error) {
      console.error('连接MetaMask失败:', error);
      showNotification('连接MetaMask失败', 'error');
    }
  };

  const loadData = async () => {
    try {
      const pools = await liquidityPoolAPI.getAll();
      setLiquidityPools(pools);
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  /** 从链上读取流动性池数据并更新状态。poolIds 为空则同步全部，否则只同步指定池子 */
  const syncPoolsFromChain = useCallback(async (poolIds?: string[]): Promise<LiquidityPool[]> => {
    const ids = poolIds && poolIds.length > 0 ? poolIds : liquidityPools.map(p => p.id);
    if (ids.length === 0) return [];

    const poolsToSync = liquidityPools.filter(p => ids.includes(p.id));
    if (poolsToSync.length === 0) return [];

    setPoolsSyncing(true);
    try {
      const signer = await getSigner();
      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);

      const updatedPools = await Promise.all(
        poolsToSync.map(async (pool) => {
          try {
            const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
            if (!pairAddress || pairAddress === ZeroAddress) return pool;

            const pairContract = new Contract(pairAddress, [
              'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
              'function token0() external view returns (address)',
              'function totalSupply() external view returns (uint256)',
              'function decimals() external view returns (uint8)',
            ], signer);

            const token1Contract = new ERC20(pool.token1Address, signer);
            const token2Contract = new ERC20(pool.token2Address, signer);
            const [reserves, token0Addr, lpTotalSupplyRaw, lpDecimals, decimals1, decimals2] = await Promise.all([
              pairContract.getReserves(),
              pairContract.token0(),
              pairContract.totalSupply(),
              pairContract.decimals(),
              token1Contract.decimals(),
              token2Contract.decimals(),
            ]);

            const reserve0 = reserves[0] as bigint;
            const reserve1 = reserves[1] as bigint;
            const token0IsToken1 = token0Addr.toLowerCase() === pool.token1Address.toLowerCase();
            const reserveToken1 = token0IsToken1 ? reserve0 : reserve1;
            const reserveToken2 = token0IsToken1 ? reserve1 : reserve0;

            return {
              ...pool,
              reserve1: Number(formatUnits(reserveToken1, decimals1)),
              reserve2: Number(formatUnits(reserveToken2, decimals2)),
              totalSupply: Number(formatUnits(lpTotalSupplyRaw, Number(lpDecimals))),
            };
          } catch {
            return pool;
          }
        })
      );

      setLiquidityPools(prev => {
        const updated = new Map(prev.map(p => [p.id, p]));
        for (const p of updatedPools) {
          updated.set(p.id, p);
        }
        return Array.from(updated.values());
      });

      for (const syncedPool of updatedPools) {
        try {
          await liquidityPoolAPI.update(syncedPool);
        } catch (e) {
          console.warn('更新后端流动性表失败:', syncedPool.id, e);
        }
      }
      return updatedPools;
    } finally {
      setPoolsSyncing(false);
    }
  }, [liquidityPools]);

  /** 从链上获取当前钱包地址的所有 Swap 交易 */
  const fetchChainTrades = useCallback(async () => {
    if (!isConnected || !ethereumAddress || liquidityPools.length === 0) {
      setChainTrades([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const signer = await getSigner();
      const provider = signer.provider;
      if (!provider) throw new Error('无法获取网络提供者');

      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);

      const swapAbi = [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
      ];

      const allTrades: ChainTrade[] = [];

      for (const pool of liquidityPools) {
        try {
          const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
          if (!pairAddress || pairAddress === ZeroAddress) continue;

          const pairContract = new Contract(pairAddress, swapAbi, provider);
          const token1Contract = new ERC20(pool.token1Address, provider);
          const token2Contract = new ERC20(pool.token2Address, provider);
          const [token0Addr, decimals1, decimals2] = await Promise.all([
            pairContract.token0(),
            token1Contract.decimals(),
            token2Contract.decimals(),
          ]);

          const token0IsToken1 = token0Addr.toLowerCase() === pool.token1Address.toLowerCase();
          const decimals0 = token0IsToken1 ? decimals1 : decimals2;
          const decimals1Val = token0IsToken1 ? decimals1 : decimals2;
          const decimals2Val = token0IsToken1 ? decimals2 : decimals1;

          const swapLogs = await pairContract.queryFilter(
            pairContract.filters.Swap(null, null, null, null, null, ethereumAddress)
          );

          for (const log of swapLogs) {
            try {
              const parsed = pairContract.interface.parseLog(log);
              if (!parsed || parsed.name !== 'Swap') continue;

              const amount0In = parsed.args[1] as bigint;
              const amount1In = parsed.args[2] as bigint;
              const amount0Out = parsed.args[3] as bigint;
              const amount1Out = parsed.args[4] as bigint;

              const block = await provider.getBlock(log.blockNumber);
              const timestamp = block?.timestamp ?? 0;

              if (amount0In > 0n && amount1Out > 0n) {
                const amount0InHuman = Number(formatUnits(amount0In, decimals0));
                const amount1OutHuman = Number(formatUnits(amount1Out, decimals2Val));
                const isBuy = !token0IsToken1;
                const amount = isBuy ? amount1OutHuman : amount0InHuman;
                const total = isBuy ? amount0InHuman : amount1OutHuman;
                const price = amount > 0 ? total / amount : 0;
                const fee = total * 0.003;

                allTrades.push({
                  txHash: log.transactionHash,
                  timestamp,
                  pairId: pool.id,
                  pairLabel: `${pool.token1}/${pool.token2}`,
                  type: isBuy ? 'buy' : 'sell',
                  amount,
                  price,
                  total,
                  fee,
                  tokenIn: token0IsToken1 ? pool.token1 : pool.token2,
                  tokenOut: token0IsToken1 ? pool.token2 : pool.token1,
                });
              } else if (amount1In > 0n && amount0Out > 0n) {
                const amount1InHuman = Number(formatUnits(amount1In, decimals1Val));
                const amount0OutHuman = Number(formatUnits(amount0Out, decimals0));
                const isBuy = token0IsToken1;
                const amount = isBuy ? amount0OutHuman : amount1InHuman;
                const total = isBuy ? amount1InHuman : amount0OutHuman;
                const price = amount > 0 ? total / amount : 0;
                const fee = total * 0.003;

                allTrades.push({
                  txHash: log.transactionHash,
                  timestamp,
                  pairId: pool.id,
                  pairLabel: `${pool.token1}/${pool.token2}`,
                  type: isBuy ? 'buy' : 'sell',
                  amount,
                  price,
                  total,
                  fee,
                  tokenIn: token0IsToken1 ? pool.token2 : pool.token1,
                  tokenOut: token0IsToken1 ? pool.token1 : pool.token2,
                });
              }
            } catch {
              // skip unparsable
            }
          }
        } catch (e) {
          console.warn('获取池子交易失败:', pool.id, e);
        }
      }

      allTrades.sort((a, b) => b.timestamp - a.timestamp);
      setChainTrades(allTrades);
    } catch (error) {
      console.error('获取链上交易失败:', error);
      showNotification('获取链上交易失败', 'error');
      setChainTrades([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [isConnected, ethereumAddress, liquidityPools, showNotification]);

  useEffect(() => {
    if (activeSection === 'history' && isConnected) {
      fetchChainTrades();
    }
  }, [activeSection, isConnected, fetchChainTrades]);

  /** 获取当前钱包地址的所有代币余额 */
  const fetchWalletTokens = useCallback(async () => {
    if (!isConnected || !ethereumAddress || liquidityPools.length === 0) {
      setPortfolioTokens([]);
      setTotalAssetValue(0);
      return;
    }
    setPortfolioLoading(true);
    try {
      const signer = await getSigner();
      const provider = signer.provider;
      if (!provider) throw new Error('无法获取网络提供者');

      // 收集所有唯一代币 (symbol, address, decimals, priceUsdt)
      const tokenMap = new Map<string, { symbol: string; address: string; decimals: number; priceUsdt: number }>();
      for (const pool of liquidityPools) {
        const priceToken1 = pool.reserve2 > 0 ? pool.reserve2 / pool.reserve1 : 0;
        const priceToken2 = pool.reserve1 > 0 ? pool.reserve1 / pool.reserve2 : 0;
        if (!tokenMap.has(pool.token1Address.toLowerCase())) {
          tokenMap.set(pool.token1Address.toLowerCase(), {
            symbol: pool.token1,
            address: pool.token1Address,
            decimals: pool.token1 === 'USDT' ? 6 : pool.token1 === 'WBTC' ? 8 : 18,
            priceUsdt: pool.token2 === 'USDT' ? priceToken1 : pool.token1 === 'USDT' ? 1 : 0,
          });
        }
        if (!tokenMap.has(pool.token2Address.toLowerCase())) {
          tokenMap.set(pool.token2Address.toLowerCase(), {
            symbol: pool.token2,
            address: pool.token2Address,
            decimals: pool.token2 === 'USDT' ? 6 : pool.token2 === 'WBTC' ? 8 : 18,
            priceUsdt: pool.token1 === 'USDT' ? priceToken2 : pool.token2 === 'USDT' ? 1 : 0,
          });
        }
      }
      // 从 USDT 池子更新非 USDT 代币价格
      for (const pool of liquidityPools) {
        const t1 = tokenMap.get(pool.token1Address.toLowerCase());
        const t2 = tokenMap.get(pool.token2Address.toLowerCase());
        if (t1 && pool.token2 === 'USDT') t1.priceUsdt = pool.reserve2 / pool.reserve1;
        if (t2 && pool.token1 === 'USDT') t2.priceUsdt = pool.reserve1 / pool.reserve2;
      }

      const results: PortfolioToken[] = [];
      const ethPool = liquidityPools.find(p => p.token1 === 'ETH' || p.token2 === 'ETH');
      const wethAddress = ethPool
        ? (ethPool.token1 === 'ETH' ? ethPool.token1Address : ethPool.token2Address)
        : null;
      const wethPrice = wethAddress ? (tokenMap.get(wethAddress.toLowerCase())?.priceUsdt ?? 0) : 0;

      // 获取原生 ETH 余额
      const nativeEthBalance = await provider.getBalance(ethereumAddress);
      const nativeEthAmount = Number(formatUnits(nativeEthBalance, 18));

      for (const [, info] of tokenMap) {
        let balance = 0;
        let decimals = info.decimals;
        if (info.symbol === 'ETH' && wethAddress) {
          const wethContract = new ERC20(wethAddress, provider);
          const [wethBal, dec] = await Promise.all([
            wethContract.balanceOf(ethereumAddress),
            wethContract.decimals(),
          ]);
          decimals = dec;
          balance = nativeEthAmount + Number(formatUnits(wethBal, dec));
        } else {
          const tokenContract = new ERC20(info.address, provider);
          const [bal, dec] = await Promise.all([
            tokenContract.balanceOf(ethereumAddress),
            tokenContract.decimals(),
          ]);
          decimals = dec;
          balance = Number(formatUnits(bal, dec));
        }
        const priceUsdt = info.priceUsdt || (info.symbol === 'USDT' ? 1 : 0);
        const valueUsdt = balance * priceUsdt;
        if (balance > 0) {
          results.push({
            symbol: info.symbol,
            balance,
            decimals,
            valueUsdt,
            priceUsdt,
            change24h: null,
            proportion: 0, // 稍后计算
          });
        }
      }

      // 若有原生 ETH 但 WETH 不在池中，单独添加
      if (nativeEthAmount > 0 && !results.some(t => t.symbol === 'ETH')) {
        results.push({
          symbol: 'ETH',
          balance: nativeEthAmount,
          decimals: 18,
          valueUsdt: nativeEthAmount * wethPrice,
          priceUsdt: wethPrice,
          change24h: null,
          proportion: 0,
        });
      }

      results.sort((a, b) => b.valueUsdt - a.valueUsdt);
      const total = results.reduce((sum, t) => sum + t.valueUsdt, 0);
      const withProportion = results.map(t => ({
        ...t,
        proportion: total > 0 ? (t.valueUsdt / total) * 100 : 0,
      }));

      setPortfolioTokens(withProportion);
      setTotalAssetValue(total);
    } catch (error) {
      console.error('获取钱包代币失败:', error);
      showNotification('获取钱包代币失败', 'error');
      setPortfolioTokens([]);
      setTotalAssetValue(0);
    } finally {
      setPortfolioLoading(false);
    }
  }, [isConnected, ethereumAddress, liquidityPools, showNotification]);

  useEffect(() => {
    if (activeSection === 'portfolio' && isConnected) {
      fetchWalletTokens();
    }
  }, [activeSection, isConnected, fetchWalletTokens]);

  /** 获取交易对的当前市价 (token1 的 USDT 价格) */
  const getCurrentPrice = (pairId: string): number => {
    const pool = liquidityPools.find(p => p.id === pairId);
    if (!pool || pool.reserve1 <= 0) return 0;
    return pool.token2 === 'USDT' ? pool.reserve2 / pool.reserve1 : pool.token1 === 'USDT' ? pool.reserve1 / pool.reserve2 : 0;
  };

  const calculateTotal = (amount: string, pairId: string) => {
    const amt = parseFloat(amount) || 0;
    const prc = getCurrentPrice(pairId);
    return (amt * prc).toFixed(2);
  };

  /** 格式化价格显示：X token2/token1 */
  const formatPriceDisplay = (pairId: string) => {
    const pool = liquidityPools.find(p => p.id === pairId);
    const price = getCurrentPrice(pairId);
    return pool ? `${price.toFixed(2)} ${pool.token2}/${pool.token1}` : '-';
  };

  const SLIPPAGE = 0.01;
  const DEADLINE_MINUTES = 20;

  /** 使用 AMM 公式计算 amountOut (0.3% fee) */
  const calcAmountOut = (amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint => {
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BigInt(1000) + amountInWithFee;
    return numerator / denominator;
  };

  /** 使用 AMM 公式计算 amountIn (0.3% fee) */
  const calcAmountIn = (amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint => {
    const numerator = reserveIn * amountOut * BigInt(1000);
    const denominator = (reserveOut - amountOut) * BigInt(997);
    return numerator / denominator + BigInt(1);
  };

  const executeTrade = async (type: 'buy' | 'sell') => {
    if (!isConnected || !ethereumAddress) {
      showNotification('请先连接MetaMask钱包', 'error');
      connectToMetaMask();
      return;
    }

    const pairId = type === 'buy' ? buyPair : sellPair;
    const amountStr = type === 'buy' ? buyAmount : sellAmount;
    const pool = liquidityPools.find(p => p.id === pairId);

    if (!pool) {
      showNotification('未找到交易对', 'error');
      return;
    }
    if (!amountStr || parseFloat(amountStr) <= 0) {
      showNotification('请输入有效的交易数量', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const signer = await getSigner();
      const router = new SwapRouter02(CONTRACT_ADDRESSES.DEXAMM_ROUTER02, signer);
      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);
      const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
      if (!pairAddress || pairAddress === ZeroAddress) {
        throw new Error('链上未找到该交易对');
      }

      const pairContract = new Contract(pairAddress, [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'function totalSupply() external view returns (uint256)',
        'function decimals() external view returns (uint8)',
      ], signer);

      const token1Contract = new ERC20(pool.token1Address, signer);
      const token2Contract = new ERC20(pool.token2Address, signer);
      const [reserves, token0Addr, lpTotalSupplyRaw, lpDecimals, decimals1, decimals2] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.totalSupply(),
        pairContract.decimals(),
        token1Contract.decimals(),
        token2Contract.decimals(),
      ]);

      const reserve0 = reserves[0] as bigint;
      const reserve1 = reserves[1] as bigint;
      const token0IsToken1 = token0Addr.toLowerCase() === pool.token1Address.toLowerCase();
      const reserveToken1 = token0IsToken1 ? reserve0 : reserve1;
      const reserveToken2 = token0IsToken1 ? reserve1 : reserve0;

      const reserve1Human = Number(formatUnits(reserveToken1, decimals1));
      const reserve2Human = Number(formatUnits(reserveToken2, decimals2));
      const totalSupplyHuman = Number(formatUnits(lpTotalSupplyRaw, Number(lpDecimals)));

      setLiquidityPools(prev => prev.map(p =>
        p.id === pairId ? { ...p, reserve1: reserve1Human, reserve2: reserve2Human, totalSupply: totalSupplyHuman } : p
      ));
      const deadline = Math.floor(Date.now() / 1000) + DEADLINE_MINUTES * 60;

      if (type === 'buy') {
        const amountOut = parseUnits(amountStr, decimals1);
        const amountInMax = calcAmountIn(amountOut, reserveToken2, reserveToken1);
        const amountInMaxWithSlippage = (amountInMax * BigInt(Math.floor((1 + SLIPPAGE) * 10000))) / BigInt(10000);
        const path = [pool.token2Address, pool.token1Address];

        const approveResult = await token2Contract.approve(router.address, amountInMaxWithSlippage);
        await approveResult.wait();
        const tx = await router.swapTokensForExactTokens(
          amountOut,
          amountInMaxWithSlippage,
          path,
          ethereumAddress,
          deadline
        );
        await tx.wait();
      } else {
        const amountIn = parseUnits(amountStr, decimals1);
        const amountOut = calcAmountOut(amountIn, reserveToken1, reserveToken2);
        const amountOutMin = (amountOut * BigInt(Math.floor((1 - SLIPPAGE) * 10000))) / BigInt(10000);
        const path = [pool.token1Address, pool.token2Address];

        const approveResult = await token1Contract.approve(router.address, amountIn);
        await approveResult.wait();
        const tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          ethereumAddress,
          deadline
        );
        await tx.wait();
      }

      showNotification(`${type === 'buy' ? '买入' : '卖出'}成功`, 'success');
      if (type === 'buy') setBuyAmount('');
      else setSellAmount('');
      if (activeSection === 'portfolio') fetchWalletTokens();
      if (activeSection === 'history') fetchChainTrades();
      await syncPoolsFromChain([pairId]);
    } catch (error) {
      console.error('交易执行失败:', error);
      showNotification(`${type === 'buy' ? '买入' : '卖出'}失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };



  const renderOverview = () => (
    <>
      <h2 className="section-title">交易概览</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">+$245.30</div>
          <div className="stat-label">今日盈亏</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">-</div>
          <div className="stat-label">总交易次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">68.5%</div>
          <div className="stat-label">胜率</div>
        </div>
      </div>
    </>
  );

  const renderTrading = () => (
    <>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="section-title">现货交易</h2>
        {isConnected && (
          <button
            className="btn btn-primary"
            onClick={() => syncPoolsFromChain()}
            disabled={poolsSyncing || liquidityPools.length === 0}
          >
            {poolsSyncing ? '同步中...' : '从链上刷新数据'}
          </button>
        )}
      </div>
      <div className="trading-interface">
        <div className="trading-form buy-form">
          <div className="trading-header">
            <h3>买入</h3>
            <div className="price-display">
              <div className="current-price">市价交易 · 当前价格 {formatPriceDisplay(buyPair)}</div>
            </div>
          </div>
          <div className="form-group">
            <label>交易对</label>
            <select value={buyPair} onChange={(e) => setBuyPair(e.target.value)}>
              {liquidityPools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.token1}/{pool.token2}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>数量</label>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              placeholder="输入购买数量"
              step="0.001"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(buyAmount, buyPair)}
              readOnly
              placeholder="自动计算"
            />
          </div>
          <button 
            className="trade-btn buy-btn btn-primary" 
            onClick={() => executeTrade('buy')}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '买入'}
          </button>
        </div>
        <div className="trading-form sell-form">
          <div className="trading-header">
            <h3>卖出</h3>
            <div className="price-display">
              <div className="current-price">市价交易 · 当前价格 {formatPriceDisplay(sellPair)}</div>
            </div>
          </div>
          <div className="form-group">
            <label>交易对</label>
            <select value={sellPair} onChange={(e) => setSellPair(e.target.value)}>
              {liquidityPools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.token1}/{pool.token2}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>数量</label>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="输入卖出数量"
              step="0.001"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(sellAmount, sellPair)}
              readOnly
              placeholder="自动计算"
            />
          </div>
          <button 
            className="trade-btn sell-btn btn-danger" 
            onClick={() => executeTrade('sell')}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : '卖出'}
          </button>
        </div>
      </div>
    </>
  );

  const formatBalance = (num: number) => {
    if (num >= 1e6) return num.toFixed(2);
    if (num >= 1) return num.toFixed(4);
    if (num >= 0.0001) return num.toFixed(6);
    return num.toExponential(2);
  };

  const renderPortfolio = () => (
    <>
      <h2 className="section-title">资产组合</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${totalAssetValue.toFixed(2)}</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">+5.2%</div>
          <div className="stat-label">24小时变化</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value">{portfolioTokens.length}</div>
          <div className="stat-label">持有币种</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">均衡</div>
          <div className="stat-label">资产配置</div>
        </div>
      </div>
      <div className="table-container">
        <div className="table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span>代币详情</span>
          {isConnected && (
            <button
              className="btn btn-primary"
              onClick={fetchWalletTokens}
              disabled={portfolioLoading}
            >
              {portfolioLoading ? '加载中...' : '刷新'}
            </button>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th>代币</th>
              <th>余额</th>
              <th>价值 (USDT)</th>
              <th>24h变化</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {!isConnected ? (
              <tr>
                <td colSpan={5} className="empty-state">请先连接钱包以查看资产</td>
              </tr>
            ) : portfolioLoading ? (
              <tr>
                <td colSpan={5} className="empty-state">正在加载代币数据...</td>
              </tr>
            ) : portfolioTokens.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">暂无资产数据</td>
              </tr>
            ) : (
              portfolioTokens.map((token) => (
                <tr key={token.symbol}>
                  <td>{token.symbol}</td>
                  <td>{formatBalance(token.balance)}</td>
                  <td>${token.valueUsdt.toFixed(2)}</td>
                  <td>
                    {token.change24h !== null ? (
                      <span className={token.change24h >= 0 ? 'positive' : 'negative'}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{token.proportion.toFixed(1)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="section-title">交易历史</h2>
        {isConnected && (
          <button
            className="btn btn-primary"
            onClick={fetchChainTrades}
            disabled={historyLoading}
          >
            {historyLoading ? '加载中...' : '刷新'}
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>交易对</th>
              <th>类型</th>
              <th>数量</th>
              <th>价格</th>
              <th>总计</th>
              <th>手续费</th>
              <th>交易哈希</th>
            </tr>
          </thead>
          <tbody>
            {!isConnected ? (
              <tr>
                <td colSpan={8} className="empty-state">请先连接钱包以查看交易历史</td>
              </tr>
            ) : historyLoading ? (
              <tr>
                <td colSpan={8} className="empty-state">正在加载链上交易...</td>
              </tr>
            ) : chainTrades.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">暂无链上交易记录</td>
              </tr>
            ) : (
              chainTrades.map((trade) => (
                <tr key={trade.txHash + trade.timestamp}>
                  <td>{new Date(trade.timestamp * 1000).toLocaleString()}</td>
                  <td>{trade.pairLabel}</td>
                  <td className={trade.type === 'buy' ? 'type-buy' : 'type-sell'}>
                    {trade.type === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td>{trade.amount.toFixed(6)}</td>
                  <td>${trade.price.toFixed(2)}</td>
                  <td>${trade.total.toFixed(2)}</td>
                  <td>${trade.fee.toFixed(2)}</td>
                  <td>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      {trade.txHash.slice(0, 10)}...{trade.txHash.slice(-8)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <Layout 
      navItems={navItems} 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      dashboardTitle="交易者仪表板"
    >
      {!isConnected && (
        <div className="dashboard-header">
          <div className="header-badge">
            <button className="btn btn-primary" onClick={connectToMetaMask}>
              连接钱包
            </button>
          </div>
        </div>
      )}

      <div className="content-section glass fade-in">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'trading' && renderTrading()}
        {activeSection === 'portfolio' && renderPortfolio()}
        {activeSection === 'history' && renderHistory()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}
