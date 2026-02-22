import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useNotification } from '../hooks/useNotification';
import { arbitrageAPI } from '../services/apiService';
import type { ArbitrageOpportunity } from '../types';
import './ArbitrageurDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '套利概览', icon: '📊' },
  { key: 'opportunities', label: '机会发现', icon: '🔍' },
  { key: 'autotrading', label: '自动交易', icon: '🤖' },
  { key: 'analysis', label: '收益分析', icon: '📈' },
];

export function ArbitrageurDashboard() {
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [autoTrading, setAutoTrading] = useState(false);
  const [minProfit, setMinProfit] = useState('10');
  const [maxVolume, setMaxVolume] = useState('100');

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const allOpportunities = await arbitrageAPI.getAll();
      setOpportunities(allOpportunities);
    } catch (error) {
      console.error('加载套利机会失败:', error);
      showNotification('加载套利机会失败', 'error');
    }
  };

  const executeArbitrage = async () => {
    try {
      await arbitrageAPI.execute();
      showNotification('套利交易执行成功', 'success');
      loadData();
    } catch (error) {
      console.error('执行套利交易失败:', error);
      showNotification('执行套利交易失败', 'error');
    }
  };

  const toggleAutoTrading = async () => {
    try {
      await arbitrageAPI.toggleAutoTrading(!autoTrading);
      setAutoTrading(!autoTrading);
      showNotification(
        autoTrading ? '自动交易已关闭' : '自动交易已开启',
        'success'
      );
    } catch (error) {
      console.error('切换自动交易状态失败:', error);
      showNotification('切换自动交易状态失败', 'error');
    }
  };

  const renderOverview = () => (
    <>
      <h2 className="section-title">套利概览</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value positive">$5,250.80</div>
          <div className="stat-label">总利润</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">92.5%</div>
          <div className="stat-label">成功率</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-value">{opportunities.length}</div>
          <div className="stat-label">当前机会</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">156</div>
          <div className="stat-label">总交易次数</div>
        </div>
      </div>
    </>
  );

  const renderOpportunities = () => (
    <>
      <h2 className="section-title">套利机会发现</h2>
      <div className="opportunities-list">
        {opportunities.map(opp => (
          <div key={opp.id} className="opportunity-card">
            <div className="opportunity-header">
              <h3>{opp.pair}</h3>
              <span className={`profit-badge ${opp.profit > 0 ? 'positive' : 'negative'}`}>
                {opp.profit > 0 ? '+' : ''}${opp.profit.toFixed(2)}
              </span>
            </div>
            <div className="opportunity-details">
              <div className="detail-row">
                <span className="detail-label">交易所1:</span>
                <span className="detail-value">{opp.exchange1}</span>
                <span className="detail-price">${opp.price1.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">交易所2:</span>
                <span className="detail-value">{opp.exchange2}</span>
                <span className="detail-price">${opp.price2.toFixed(2)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">价差:</span>
                <span className={`detail-value ${opp.spread > 0 ? 'positive' : 'negative'}`}>
                  {opp.spread > 0 ? '+' : ''}{opp.spread.toFixed(2)}%
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">交易量:</span>
                <span className="detail-value">{opp.volume}</span>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => executeArbitrage()}
              disabled={opp.profit <= 0}
            >
              执行套利
            </button>
          </div>
        ))}
      </div>
    </>
  );

  const renderAutoTrading = () => (
    <>
      <h2 className="section-title">自动交易设置</h2>
      <div className="auto-trading-card">
        <div className="toggle-section">
          <div className="toggle-info">
            <h3>自动套利交易</h3>
            <p>开启后系统将自动执行符合条件的套利机会</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoTrading}
              onChange={toggleAutoTrading}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="settings-grid">
          <div className="form-group">
            <label>最小利润 (USDT)</label>
            <input
              type="number"
              value={minProfit}
              onChange={(e) => setMinProfit(e.target.value)}
              placeholder="10"
            />
          </div>
          <div className="form-group">
            <label>最大交易量</label>
            <input
              type="number"
              value={maxVolume}
              onChange={(e) => setMaxVolume(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="strategy-info">
          <h4>当前策略</h4>
          <ul>
            <li>最小利润阈值: ${minProfit} USDT</li>
            <li>最大单笔交易量: {maxVolume}</li>
            <li>风险控制: 启用</li>
            <li>滑点保护: 0.5%</li>
          </ul>
        </div>
      </div>
    </>
  );

  const renderAnalysis = () => (
    <>
      <h2 className="section-title">收益分析</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value positive">$5,250.80</div>
          <div className="stat-label">累计利润</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">$125.50</div>
          <div className="stat-label">日均利润</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">92.5%</div>
          <div className="stat-label">成功率</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">156</div>
          <div className="stat-label">总交易次数</div>
        </div>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>交易对</th>
              <th>交易所</th>
              <th>利润</th>
              <th>交易量</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="empty-state">暂无交易记录</td>
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
      dashboardTitle="套利者仪表板"
    >
      {/* 钱包连接状态已移至顶部导航栏 */}

      <div className="content-section glass fade-in">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'opportunities' && renderOpportunities()}
        {activeSection === 'autotrading' && renderAutoTrading()}
        {activeSection === 'analysis' && renderAnalysis()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

