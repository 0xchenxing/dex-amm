import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolAPI } from '../services/apiService';
import { SwapRouter02, ERC20, getSigner } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Contract, ZeroAddress, formatUnits, parseUnits } from 'ethers';
import type { LiquidityPool } from '../types';
import './LiquidityDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '收益统计', icon: '📊' },
  { key: 'pools', label: '流动性池', icon: '💧' },
  { key: 'lptokens', label: 'LP代币', icon: '🪙' },
  { key: 'history', label: '操作历史', icon: '📜' },
];

export function LiquidityDashboard() {
  const { user } = useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [addAmount1, setAddAmount1] = useState('');
  const [addAmount2, setAddAmount2] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lpTokenData, setLpTokenData] = useState<Record<string, { balance: number; valueUsdt: number | null; earningsUsdt: number | null }>>({});
  const [historyRecords, setHistoryRecords] = useState<Array<{
    txHash: string;
    timestamp: number;
    poolId: string;
    operation: '添加流动性' | '移除流动性';
    lpAmount: number | null;
    amount1: number;
    amount2: number;
    token1: string;
    token2: string;
  }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allPools = await liquidityPoolAPI.getAll();
      // console.log('Debug - loadData:', allPools);
      setPools(allPools);
      if (allPools.length > 0 && !selectedPool) {
        setSelectedPool(allPools[0].id);
      }
    } catch (error) {
      console.error('加载流动性池失败:', error);
      showNotification('加载流动性池失败', 'error');
    }
  };

  const formatDisplayNumber = (value: number): string => {
    if (!Number.isFinite(value) || value === 0) return '0';
    const raw = value.toString();
    if (!/[eE]/.test(raw)) return raw;

    const [base, expPart] = raw.toLowerCase().split('e');
    const exponent = Number(expPart);
    const sign = base.startsWith('-') ? '-' : '';
    const unsignedBase = sign ? base.slice(1) : base;
    const [intPart, fracPart = ''] = unsignedBase.split('.');
    const digits = intPart + fracPart;
    const decimalIndex = intPart.length + exponent;

    let plain: string;
    if (decimalIndex <= 0) {
      plain = `0.${'0'.repeat(Math.abs(decimalIndex))}${digits}`;
    } else if (decimalIndex >= digits.length) {
      plain = `${digits}${'0'.repeat(decimalIndex - digits.length)}`;
    } else {
      plain = `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
    }

    const normalized = plain.replace(/\.?0+$/, '');
    return `${sign}${normalized || '0'}`;
  };

  const syncPoolFromChain = async (pool: LiquidityPool, signer: Awaited<ReturnType<typeof getSigner>>) => {
    const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
      'function getPair(address tokenA, address tokenB) external view returns (address)',
    ], signer);
    const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
    if (!pairAddress || pairAddress === ZeroAddress) {
      throw new Error('链上未找到该交易对对应的池子');
    }

    const pairContract = new Contract(pairAddress, [
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
      'function token0() external view returns (address)',
      'function totalSupply() external view returns (uint256)',
      'function decimals() external view returns (uint8)',
    ], signer);

    const token1Contract = new ERC20(pool.token1Address, signer);
    const token2Contract = new ERC20(pool.token2Address, signer);
    const [reserves, token0, lpTotalSupplyRaw, lpDecimals, decimals1, decimals2] = await Promise.all([
      pairContract.getReserves(),
      pairContract.token0(),
      pairContract.totalSupply(),
      pairContract.decimals(),
      token1Contract.decimals(),
      token2Contract.decimals(),
    ]);

    const reserve0 = reserves[0] as bigint;
    const reserve1 = reserves[1] as bigint;
    const reserveToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve0 : reserve1;
    const reserveToken2 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve1 : reserve0;

    const latestPool = await liquidityPoolAPI.getById(pool.id);
    const syncedPool: LiquidityPool = {
      ...latestPool,
      reserve1: Number(formatUnits(reserveToken1, decimals1)),
      reserve2: Number(formatUnits(reserveToken2, decimals2)),
      totalSupply: Number(formatUnits(lpTotalSupplyRaw, Number(lpDecimals))),
    };
    await liquidityPoolAPI.update(syncedPool);
  };

  const loadLPTokenData = async () => {
    if (pools.length === 0) {
      setLpTokenData({});
      return;
    }

    try {
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);

      const results = await Promise.all(
        pools.map(async (pool) => {
          try {
            const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
            if (!pairAddress || pairAddress === ZeroAddress) {
              return [pool.id, { balance: 0, valueUsdt: 0 }] as const;
            }

            const pairContract = new Contract(pairAddress, [
              'function balanceOf(address) external view returns (uint256)',
              'function totalSupply() external view returns (uint256)',
              'function decimals() external view returns (uint8)',
              'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
              'function token0() external view returns (address)',
              'event Transfer(address indexed from, address indexed to, uint256 value)',
              'event Mint(address indexed sender, uint amount0, uint amount1)',
              'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
            ], signer);
            const token1Contract = new ERC20(pool.token1Address, signer);
            const token2Contract = new ERC20(pool.token2Address, signer);

            const [lpBalanceRaw, lpTotalSupplyRaw, lpDecimals, reserves, token0, decimals1, decimals2] = await Promise.all([
              pairContract.balanceOf(userAddress),
              pairContract.totalSupply(),
              pairContract.decimals(),
              pairContract.getReserves(),
              pairContract.token0(),
              token1Contract.decimals(),
              token2Contract.decimals(),
            ]);

            const balance = Number(formatUnits(lpBalanceRaw, Number(lpDecimals)));
            const totalSupply = Number(formatUnits(lpTotalSupplyRaw, Number(lpDecimals)));
            const share = totalSupply > 0 ? balance / totalSupply : 0;

            const reserve0 = reserves[0] as bigint;
            const reserve1 = reserves[1] as bigint;
            const reserveToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve0 : reserve1;
            const reserveToken2 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve1 : reserve0;
            const reserve1Human = Number(formatUnits(reserveToken1, decimals1));
            const reserve2Human = Number(formatUnits(reserveToken2, decimals2));
            const token0IsToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase();

            let valueUsdt: number | null = null;
            let earningsUsdt: number | null = null;
            let investedUsdt: number | null = null;
            if (pool.token1.toUpperCase() === 'USDT') {
              valueUsdt = share * reserve1Human * 2;
            } else if (pool.token2.toUpperCase() === 'USDT') {
              valueUsdt = share * reserve2Human * 2;
            }

            // Earnings estimation is best-effort only. Even if it fails,
            // keep on-chain LP balance/value visible.
            if (valueUsdt != null && signer.provider) {
              try {
                let netToken1 = 0;
                let netToken2 = 0;
                const mintTransferLogs = await pairContract.queryFilter(pairContract.filters.Transfer(ZeroAddress, userAddress));
                const burnLogs = await pairContract.queryFilter(pairContract.filters.Burn(null, null, null, userAddress));

                for (const log of mintTransferLogs) {
                  const receipt = await signer.provider.getTransactionReceipt(log.transactionHash);
                  if (!receipt) continue;
                  for (const item of receipt.logs) {
                    if (item.address.toLowerCase() !== pairAddress.toLowerCase()) continue;
                    try {
                      const parsed = pairContract.interface.parseLog(item);
                      if (parsed?.name === 'Mint') {
                        const amount0 = parsed.args[1] as bigint;
                        const amount1 = parsed.args[2] as bigint;
                        if (token0IsToken1) {
                          netToken1 += Number(formatUnits(amount0, decimals1));
                          netToken2 += Number(formatUnits(amount1, decimals2));
                        } else {
                          netToken1 += Number(formatUnits(amount1, decimals1));
                          netToken2 += Number(formatUnits(amount0, decimals2));
                        }
                        break;
                      }
                    } catch {
                      // ignore unparsable logs
                    }
                  }
                }

                for (const log of burnLogs) {
                  try {
                    const parsed = pairContract.interface.parseLog(log);
                    if (parsed?.name === 'Burn') {
                      const amount0 = parsed.args[1] as bigint;
                      const amount1 = parsed.args[2] as bigint;
                      if (token0IsToken1) {
                        netToken1 -= Number(formatUnits(amount0, decimals1));
                        netToken2 -= Number(formatUnits(amount1, decimals2));
                      } else {
                        netToken1 -= Number(formatUnits(amount1, decimals1));
                        netToken2 -= Number(formatUnits(amount0, decimals2));
                      }
                    }
                  } catch {
                    // ignore unparsable logs
                  }
                }

                if (pool.token1.toUpperCase() === 'USDT') {
                  const token2PriceInUsdt = reserve2Human > 0 ? reserve1Human / reserve2Human : 0;
                  investedUsdt = netToken1 + netToken2 * token2PriceInUsdt;
                } else if (pool.token2.toUpperCase() === 'USDT') {
                  const token1PriceInUsdt = reserve1Human > 0 ? reserve2Human / reserve1Human : 0;
                  investedUsdt = netToken2 + netToken1 * token1PriceInUsdt;
                }

                if (investedUsdt != null) {
                  earningsUsdt = valueUsdt - investedUsdt;
                }
              } catch {
                earningsUsdt = null;
              }
            }

            return [pool.id, { balance, valueUsdt, earningsUsdt }] as const;
          } catch {
            return [pool.id, { balance: 0, valueUsdt: null, earningsUsdt: null }] as const;
          }
        })
      );

      setLpTokenData(Object.fromEntries(results));
    } catch (error) {
      console.error('加载链上 LP 信息失败:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'lptokens') {
      loadLPTokenData();
    }
  }, [activeSection, pools]);

  const loadLiquidityOperationHistory = async () => {
    if (pools.length === 0) {
      setHistoryRecords([]);
      return;
    }

    try {
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      const provider = signer.provider;
      if (!provider) return;

      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);

      const allRecords = await Promise.all(
        pools.map(async (pool) => {
          try {
            const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
            if (!pairAddress || pairAddress === ZeroAddress) return [] as typeof historyRecords;

            const pairContract = new Contract(pairAddress, [
              'function token0() external view returns (address)',
              'function decimals() external view returns (uint8)',
              'event Mint(address indexed sender, uint amount0, uint amount1)',
              'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
              'event Transfer(address indexed from, address indexed to, uint256 value)',
            ], signer);

            const token1Contract = new ERC20(pool.token1Address, signer);
            const token2Contract = new ERC20(pool.token2Address, signer);
            const [token0, lpDecimals, decimals1, decimals2] = await Promise.all([
              pairContract.token0(),
              pairContract.decimals(),
              token1Contract.decimals(),
              token2Contract.decimals(),
            ]);

            const addLogs = await pairContract.queryFilter(pairContract.filters.Transfer(ZeroAddress, userAddress));
            const removeLogs = await pairContract.queryFilter(pairContract.filters.Burn(null, null, null, userAddress));

            const addRecords = await Promise.all(
              addLogs.map(async (log) => {
                const parsedTransfer = pairContract.interface.parseLog(log);
                const lpAmount = parsedTransfer ? Number(formatUnits(parsedTransfer.args[2] as bigint, Number(lpDecimals))) : null;
                const receipt = await provider.getTransactionReceipt(log.transactionHash);
                const block = await provider.getBlock(log.blockNumber);
                let amountToken1 = 0;
                let amountToken2 = 0;

                if (receipt) {
                  for (const item of receipt.logs) {
                    if (item.address.toLowerCase() !== pairAddress.toLowerCase()) continue;
                    try {
                      const parsed = pairContract.interface.parseLog(item);
                      if (parsed?.name === 'Mint') {
                        const amount0 = parsed.args[1] as bigint;
                        const amount1 = parsed.args[2] as bigint;
                        const token0IsToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase();
                        amountToken1 = Number(formatUnits(token0IsToken1 ? amount0 : amount1, decimals1));
                        amountToken2 = Number(formatUnits(token0IsToken1 ? amount1 : amount0, decimals2));
                        break;
                      }
                    } catch {
                      // ignore
                    }
                  }
                }

                return {
                  txHash: log.transactionHash,
                  timestamp: block?.timestamp ?? 0,
                  poolId: pool.id,
                  operation: '添加流动性' as const,
                  lpAmount,
                  amount1: amountToken1,
                  amount2: amountToken2,
                  token1: pool.token1,
                  token2: pool.token2,
                };
              })
            );

            const removeRecords = await Promise.all(
              removeLogs.map(async (log) => {
                const parsed = pairContract.interface.parseLog(log);
                if (!parsed) {
                  return {
                    txHash: log.transactionHash,
                    timestamp: 0,
                    poolId: pool.id,
                    operation: '移除流动性' as const,
                    lpAmount: null,
                    amount1: 0,
                    amount2: 0,
                    token1: pool.token1,
                    token2: pool.token2,
                  };
                }
                const amount0 = parsed.args[1] as bigint;
                const amount1 = parsed.args[2] as bigint;
                const token0IsToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase();
                const amountToken1 = token0IsToken1 ? amount0 : amount1;
                const amountToken2 = token0IsToken1 ? amount1 : amount0;

                const block = await provider.getBlock(log.blockNumber);
                const receipt = await provider.getTransactionReceipt(log.transactionHash);
                let lpAmount: number | null = null;
                if (receipt) {
                  for (const item of receipt.logs) {
                    if (item.address.toLowerCase() !== pairAddress.toLowerCase()) continue;
                    try {
                      const transferParsed = pairContract.interface.parseLog(item);
                      if (
                        transferParsed?.name === 'Transfer' &&
                        (transferParsed.args[0] as string).toLowerCase() === userAddress.toLowerCase() &&
                        (transferParsed.args[1] as string).toLowerCase() === pairAddress.toLowerCase()
                      ) {
                        lpAmount = Number(formatUnits(transferParsed.args[2] as bigint, Number(lpDecimals)));
                        break;
                      }
                    } catch {
                      // ignore
                    }
                  }
                }

                return {
                  txHash: log.transactionHash,
                  timestamp: block?.timestamp ?? 0,
                  poolId: pool.id,
                  operation: '移除流动性' as const,
                  lpAmount,
                  amount1: Number(formatUnits(amountToken1, decimals1)),
                  amount2: Number(formatUnits(amountToken2, decimals2)),
                  token1: pool.token1,
                  token2: pool.token2,
                };
              })
            );
            return [...addRecords, ...removeRecords];
          } catch {
            return [] as typeof historyRecords;
          }
        })
      );

      const flattened = allRecords.flat().sort((a, b) => b.timestamp - a.timestamp);
      setHistoryRecords(flattened);
    } catch (error) {
      console.error('加载链上操作历史失败:', error);
      setHistoryRecords([]);
    }
  };

  useEffect(() => {
    if (activeSection === 'history') {
      loadLiquidityOperationHistory();
    }
  }, [activeSection, pools]);

  const addLiquidity = async () => {
    if (!user || !selectedPool) return;

    const pool = pools.find(p => p.id === selectedPool);
    // console.log('Debug - addLiquidity pool:', pool);
    if (!pool) return;

    const amount1 = parseFloat(addAmount1);
    const amount2 = parseFloat(addAmount2);

    if (!amount1 || !amount2 || amount1 <= 0 || amount2 <= 0) {
      showNotification('请输入有效的流动性数量', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      
      const routerAddress = CONTRACT_ADDRESSES.DEXAMM_ROUTER02;
      const router = new SwapRouter02(routerAddress, signer);
      
      const token1Contract = new ERC20(pool.token1Address, signer);
      const token2Contract = new ERC20(pool.token2Address, signer);
      
      const decimals1 = await token1Contract.decimals();
      // console.log(decimals1)
      const decimals2 = await token2Contract.decimals();
      // console.log(decimals2)
      
      let amount1Wei = parseUnits(amount1.toString(), decimals1);
      let amount2Wei = parseUnits(amount2.toString(), decimals2);

      // Align desired amounts to current on-chain pool ratio to avoid INSUFFICIENT_*_AMOUNT.
      const factoryAddress = CONTRACT_ADDRESSES.DEXAMM_FACTORY;
      const factory = new Contract(factoryAddress, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);
      const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
      if (pairAddress && pairAddress !== ZeroAddress) {
        const pair = new Contract(pairAddress, [
          'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
          'function token0() external view returns (address)',
        ], signer);
        const [reserves, token0] = await Promise.all([
          pair.getReserves(),
          pair.token0(),
        ]);
        const reserve0 = reserves[0] as bigint;
        const reserve1 = reserves[1] as bigint;
        const reserveToken1 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve0 : reserve1;
        const reserveToken2 = token0.toLowerCase() === pool.token1Address.toLowerCase() ? reserve1 : reserve0;

        if (reserveToken1 > 0n && reserveToken2 > 0n) {
          const optimalAmount2 = amount1Wei * reserveToken2 / reserveToken1;
          if (optimalAmount2 <= amount2Wei && optimalAmount2 > 0n) {
            amount2Wei = optimalAmount2;
          } else {
            const optimalAmount1 = amount2Wei * reserveToken1 / reserveToken2;
            if (optimalAmount1 > 0n) {
              amount1Wei = optimalAmount1;
            }
          }
        }
      }

      const allowance1 = await token1Contract.allowance(userAddress, routerAddress);
      const allowance2 = await token2Contract.allowance(userAddress, routerAddress);
      if (allowance1 < amount1Wei) {
        showNotification('正在授权 ' + pool.token1 + '...', 'info');
        const approve1Result = await token1Contract.approve(routerAddress, amount1Wei);
        await approve1Result.wait();
        showNotification(pool.token1 + ' 授权成功', 'success');
      }
      
      if (allowance2 < amount2Wei) {
        showNotification('正在授权 ' + pool.token2 + '...', 'info');
        const approve2Result = await token2Contract.approve(routerAddress, amount2Wei);
        await approve2Result.wait();
        showNotification(pool.token2 + ' 授权成功', 'success');
      }
      
      showNotification('正在添加流动性...', 'info');
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const slippageTolerance = 0.5;
      const amount1Min = amount1Wei * BigInt(Math.floor((1 - slippageTolerance / 100) * 1000)) / BigInt(1000);
      const amount2Min = amount2Wei * BigInt(Math.floor((1 - slippageTolerance / 100) * 1000)) / BigInt(1000);
      
      const tx = await router.addLiquidity(
        pool.token1Address,
        pool.token2Address,
        amount1Wei,
        amount2Wei,
        amount1Min,
        amount2Min,
        userAddress,
        deadline
      );
      
      const receipt = await tx.wait();
      const txHash = receipt!.hash;
      
      await syncPoolFromChain(pool, signer);

      showNotification(`流动性添加成功，交易哈希: ${txHash.substring(0, 10)}...`, 'success');
      
      setAddAmount1('');
      setAddAmount2('');
      loadData();
    } catch (error) {
      console.error('添加流动性失败:', error);
      showNotification('添加流动性失败，请检查网络连接和钱包状态', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removeLiquidity = async () => {
    if (!user || !selectedPool) return;

    const pool = pools.find(p => p.id === selectedPool);
    if (!pool) return;

    const amount = parseFloat(removeAmount);
    if (!amount || amount <= 0) {
      showNotification('请输入有效的移除数量', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const signer = await getSigner();
      const userAddress = await signer.getAddress();
      
      const routerAddress = CONTRACT_ADDRESSES.DEXAMM_ROUTER02;
      const router = new SwapRouter02(routerAddress, signer);
      
      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function getPair(address tokenA, address tokenB) external view returns (address)',
      ], signer);
      const pairAddress = await factory.getPair(pool.token1Address, pool.token2Address);
      if (!pairAddress || pairAddress === ZeroAddress) {
        throw new Error('链上未找到该交易对对应的池子');
      }
      const lpTokenContract = new ERC20(pairAddress, signer);
      const [lpDecimals, lpBalanceRaw] = await Promise.all([
        lpTokenContract.decimals(),
        lpTokenContract.balanceOf(userAddress),
      ]);

      const liquidityWei = parseUnits(amount.toString(), lpDecimals);
      if (liquidityWei <= 0n) {
        throw new Error('请输入有效的 LP 数量');
      }
      if (liquidityWei > lpBalanceRaw) {
        const maxRemovable = formatUnits(lpBalanceRaw, lpDecimals);
        throw new Error(`移除数量超过LP余额，当前最多可移除 ${maxRemovable}`);
      }

      const lpAllowance = await lpTokenContract.allowance(userAddress, routerAddress);
      if (lpAllowance < liquidityWei) {
        showNotification('正在授权 LP 代币...', 'info');
        const approveLp = await lpTokenContract.approve(routerAddress, liquidityWei);
        await approveLp.wait();
        showNotification('LP 代币授权成功', 'success');
      }
      showNotification('正在移除流动性...', 'info');
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const amount1Min = BigInt(0);
      const amount2Min = BigInt(0);
      
      const result = await router.removeLiquidity(
        pool.token1Address,
        pool.token2Address,
        liquidityWei,
        amount1Min,
        amount2Min,
        userAddress,
        deadline
      );
      
      const receipt = await result.wait();
      const txHash = receipt!.hash;
      
      await syncPoolFromChain(pool, signer);
      showNotification(`流动性移除成功，交易哈希: ${txHash.substring(0, 10)}...`, 'success');
      setRemoveAmount('');
      loadData();
    } catch (error) {
      console.error('移除流动性失败:', error);
      showNotification('移除流动性失败，请检查网络连接和钱包状态', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalEarnings = () => 1250.50;
  const calculateDailyEarnings = () => 45.30;

  const renderOverview = () => (
    <>
      <h2 className="section-title">收益统计</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">${calculateTotalEarnings().toFixed(2)}</div>
          <div className="stat-label">总收益</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">${calculateDailyEarnings().toFixed(2)}</div>
          <div className="stat-label">日收益</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">15.2%</div>
          <div className="stat-label">平均APY</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-value">$850.00</div>
          <div className="stat-label">手续费收入</div>
        </div>
      </div>
    </>
  );

  const renderPools = () => (
    <>
      <h2 className="section-title">流动性池管理</h2>
      
      <div className="pool-list">
        {pools.map(pool => (
          <div key={pool.id} className="pool-card">
            <div className="pool-header">
              <h3>{pool.pair}</h3>
              <span className={`pool-status ${pool.status}`}>
                {pool.status === 'active' ? '活跃' : '非活跃'}
              </span>
            </div>
            <div className="pool-stats">
              <div className="pool-stat">
                <span className="pool-stat-label">总供应</span>
                <span className="pool-stat-value">{formatDisplayNumber(pool.totalSupply)}</span>
              </div>
              <div className="pool-stat">
                <span className="pool-stat-label">池子ID</span>
                <span className="pool-stat-value">{pool.id}</span>
              </div>
            </div>
            <div className="pool-reserves">
              <div className="reserve-item">
                <span>{pool.token1}</span>
                <span>{pool.reserve1.toFixed(4)}</span>
              </div>
              <div className="reserve-item">
                <span>{pool.token2}</span>
                <span>{pool.reserve2.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="liquidity-actions">
        <div className="action-card">
          <h3>添加流动性</h3>
          <div className="form-group">
            <label>选择池子</label>
            <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)}>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>{pool.pair}</option>
              ))}
            </select>
          </div>
          {selectedPool && (() => {
            const pool = pools.find(p => p.id === selectedPool);
            if (!pool) return null;
            return (
              <>
                <div className="form-group">
                  <label>{pool.token1} 数量</label>
                  <input
                    type="number"
                    value={addAmount1}
                    onChange={(e) => setAddAmount1(e.target.value)}
                    placeholder="输入数量"
                    step="0.001"
                  />
                </div>
                <div className="form-group">
                  <label>{pool.token2} 数量</label>
                  <input
                    type="number"
                    value={addAmount2}
                    onChange={(e) => setAddAmount2(e.target.value)}
                    placeholder="输入数量"
                    step="0.01"
                  />
                </div>
                <button className="btn btn-primary" onClick={addLiquidity} disabled={isLoading}>
                  {isLoading ? '添加中...' : '添加流动性'}
                </button>
              </>
            );
          })()}
        </div>

        <div className="action-card">
          <h3>移除流动性</h3>
          <div className="form-group">
            <label>选择池子</label>
            <select value={selectedPool} onChange={(e) => setSelectedPool(e.target.value)}>
              {pools.map(pool => (
                <option key={pool.id} value={pool.id}>{pool.pair}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>LP代币数量</label>
            <input
              type="number"
              value={removeAmount}
              onChange={(e) => setRemoveAmount(e.target.value)}
              placeholder="输入LP代币数量"
              step="0.01"
            />
          </div>
          <button className="btn btn-danger" onClick={removeLiquidity} disabled={isLoading}>
            {isLoading ? '移除中...' : '移除流动性'}
          </button>
        </div>
      </div>
    </>
  );

  const renderLPTokens = () => (
    <>
      <h2 className="section-title">LP代币管理</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>池子</th>
              <th>LP代币余额</th>
              <th>价值 (USDT)</th>
              <th>收益</th>
            </tr>
          </thead>
          <tbody>
            {pools.map(pool => (
              <tr key={pool.id}>
                <td><strong>{pool.pair}</strong></td>
                <td>{formatDisplayNumber(lpTokenData[pool.id]?.balance ?? 0)}</td>
                <td>
                  {lpTokenData[pool.id]?.valueUsdt == null
                    ? '-'
                    : `$${formatDisplayNumber(lpTokenData[pool.id]?.valueUsdt ?? 0)}`}
                </td>
                <td>
                  {lpTokenData[pool.id]?.earningsUsdt == null
                    ? '-'
                    : `$${formatDisplayNumber(lpTokenData[pool.id]?.earningsUsdt ?? 0)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <h2 className="section-title">操作历史</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>池子</th>
              <th>操作</th>
              <th>数量</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {historyRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">暂无操作记录</td>
              </tr>
            ) : (
              historyRecords.map((item) => (
                <tr key={`${item.txHash}-${item.poolId}`}>
                  <td>{item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : '-'}</td>
                  <td>{item.poolId}</td>
                  <td>{item.operation}</td>
                  <td>{item.lpAmount == null ? '-' : formatDisplayNumber(item.lpAmount)}</td>
                  <td>{`${formatDisplayNumber(item.amount1)} ${item.token1} + ${formatDisplayNumber(item.amount2)} ${item.token2}`}</td>
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
      dashboardTitle="流动性提供者仪表板"
    >
      {/* 钱包连接状态已移至顶部导航栏 */}

      <div className="content-section glass fade-in">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'pools' && renderPools()}
        {activeSection === 'lptokens' && renderLPTokens()}
        {activeSection === 'history' && renderHistory()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

