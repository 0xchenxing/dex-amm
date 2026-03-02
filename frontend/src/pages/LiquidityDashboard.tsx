import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolAPI, userAPI } from '../services/apiService';
import { SwapRouter02, ERC20, getSigner } from '../services/contractService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { parseUnits } from 'ethers';
import type { LiquidityPool } from '../types';
import './LiquidityDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '收益统计', icon: '📊' },
  { key: 'pools', label: '流动性池', icon: '💧' },
  { key: 'lptokens', label: 'LP代币', icon: '🪙' },
  { key: 'history', label: '收益历史', icon: '📜' },
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
      console.log(decimals1)
      const decimals2 = await token2Contract.decimals();
      console.log(decimals2)
      
      const amount1Wei = parseUnits(amount1.toString(), decimals1);
      const amount2Wei = parseUnits(amount2.toString(), decimals2);
      
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
      
      await liquidityPoolAPI.addLiquidity(selectedPool, amount1, amount2, txHash);

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
      
      const liquidityWei = parseUnits(amount.toString(), 18);
      
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
      
      await liquidityPoolAPI.removeLiquidity(selectedPool, amount, txHash);
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
                <span className="pool-stat-label">总流动性</span>
                <span className="pool-stat-value">${pool.totalLiquidity.toLocaleString()}</span>
              </div>
              <div className="pool-stat">
                <span className="pool-stat-label">24h交易量</span>
                <span className="pool-stat-value">${pool.volume24h.toLocaleString()}</span>
              </div>
              <div className="pool-stat">
                <span className="pool-stat-label">APY</span>
                <span className="pool-stat-value positive">{pool.apy}%</span>
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
              <th>APY</th>
              <th>收益</th>
            </tr>
          </thead>
          <tbody>
            {pools.map(pool => (
              <tr key={pool.id}>
                <td><strong>{pool.pair}</strong></td>
                <td>0.00</td>
                <td>$0.00</td>
                <td className="positive">{pool.apy}%</td>
                <td>$0.00</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <h2 className="section-title">收益历史</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>池子</th>
              <th>操作</th>
              <th>数量</th>
              <th>收益</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="empty-state">暂无收益记录</td>
            </tr>
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

