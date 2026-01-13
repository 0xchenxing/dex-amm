import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolStorage, userStorage } from '../services/storage';
import type { LiquidityPool } from '../types';
import './LiquidityDashboard.css';

const navItems: Array<{ path: string; label: string; icon: string }> = [];

export function LiquidityDashboard() {
  const { user } = useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [addAmount1, setAddAmount1] = useState('');
  const [addAmount2, setAddAmount2] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allPools = liquidityPoolStorage.getAll();
    setPools(allPools);
    if (allPools.length > 0 && !selectedPool) {
      setSelectedPool(allPools[0].id);
    }
  };

  const addLiquidity = () => {
    if (!user || !selectedPool) return;

    const pool = pools.find(p => p.id === selectedPool);
    if (!pool) return;

    const amount1 = parseFloat(addAmount1);
    const amount2 = parseFloat(addAmount2);

    if (!amount1 || !amount2 || amount1 <= 0 || amount2 <= 0) {
      showNotification('请输入有效的流动性数量', 'error');
      return;
    }

    if (user.balance[pool.token1] < amount1 || user.balance[pool.token2] < amount2) {
      showNotification('余额不足', 'error');
      return;
    }

    const updatedUser = { ...user };
    updatedUser.balance[pool.token1] -= amount1;
    updatedUser.balance[pool.token2] -= amount2;
    userStorage.update(updatedUser);

    showNotification('流动性添加成功', 'success');
    setAddAmount1('');
    setAddAmount2('');
    loadData();
  };

  const removeLiquidity = () => {
    if (!user || !selectedPool) return;

    const amount = parseFloat(removeAmount);
    if (!amount || amount <= 0) {
      showNotification('请输入有效的移除数量', 'error');
      return;
    }

    showNotification('流动性移除成功', 'success');
    setRemoveAmount('');
    loadData();
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
                <button className="btn btn-primary" onClick={addLiquidity}>
                  添加流动性
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
          <button className="btn btn-danger" onClick={removeLiquidity}>
            移除流动性
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
    <Layout navItems={navItems}>
      <div className="dashboard-header">
        <h1 className="header-title">流动性提供者仪表板</h1>
      </div>

      <div className="section-tabs">
        <button
          className={`tab-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <span>📊</span>
          <span>收益统计</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveSection('pools')}
        >
          <span>💧</span>
          <span>流动性池</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'lptokens' ? 'active' : ''}`}
          onClick={() => setActiveSection('lptokens')}
        >
          <span>🪙</span>
          <span>LP代币</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          <span>📜</span>
          <span>收益历史</span>
        </button>
      </div>

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

