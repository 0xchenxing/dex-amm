import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { tradeAPI, userAPI, liquidityPoolAPI } from '../services/apiService';
import { getSigner, ERC20, SwapRouter02 } from '../services/contractService';
import type { Trade, LiquidityPool } from '../types';
import './TraderDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '交易概览', icon: '📊' },
  { key: 'trading', label: '现货交易', icon: '💱' },
  { key: 'orders', label: '订单管理', icon: '📋' },
  { key: 'portfolio', label: '资产组合', icon: '💼' },
  { key: 'history', label: '交易历史', icon: '📜' },
];

export function TraderDashboard() {
  const { user } = useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Trade[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  
  const [ethereumAddress, setEthereumAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [buyPair, setBuyPair] = useState('ETH-USDT');
  const [buyAmount, setBuyAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPair, setSellPair] = useState('ETH-USDT');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    loadData();
    connectToMetaMask();
  }, []);

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
      
      if (user) {
        const userTrades = await tradeAPI.getByUser(user.id.toString());
        setTrades(userTrades || []);
        setOrders((userTrades || []).filter(t => t.status === 'pending'));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      showNotification('加载数据失败', 'error');
    }
  };

  const getCurrentPrice = (pairId: string) => {
    const pool = liquidityPools.find(p => p.id === pairId);
    return 0;
  };

  const calculateTotal = (amount: string, price: string, pairPrice: number) => {
    const amt = parseFloat(amount) || 0;
    const prc = parseFloat(price) || pairPrice;
    return (amt * prc).toFixed(2);
  };

  const executeTrade = async (type: 'buy' | 'sell') => {
    if (!user || !isConnected || !ethereumAddress) {
      showNotification('请先连接MetaMask钱包', 'error');
      connectToMetaMask();
      return;
    }

    setIsLoading(true);

    try {
      const pairId = type === 'buy' ? buyPair : sellPair;
      const amount = type === 'buy' ? buyAmount : sellAmount;
      const price = type === 'buy' ? buyPrice : sellPrice;

      if (!amount || parseFloat(amount) <= 0) {
        showNotification('请输入有效的交易数量', 'error');
        setIsLoading(false);
        return;
      }

      if (!price || parseFloat(price) <= 0) {
        showNotification('请输入有效的交易价格', 'error');
        setIsLoading(false);
        return;
      }

      const tradePrice = parseFloat(price);
      const tradeAmount = parseFloat(amount);
      const total = tradeAmount * tradePrice;
      const fee = total * 0.003;

      const newTrade: Trade = {
        id: Date.now().toString(),
        user: user.id.toString(),
        pair: pairId,
        type: type,
        amount: tradeAmount,
        price: tradePrice,
        total: total,
        fee: fee,
        timestamp: new Date().toISOString(),
        status: 'completed',
      };

      await tradeAPI.create(newTrade);
      loadData();

      showNotification(`${type === 'buy' ? '买入' : '卖出'}成功`, 'success');
      
      if (type === 'buy') {
        setBuyAmount('');
        setBuyPrice('');
      } else {
        setSellAmount('');
        setSellPrice('');
      }
    } catch (error) {
      console.error('交易执行失败:', error);
      showNotification(`${type === 'buy' ? '买入' : '卖出'}失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await tradeAPI.updateStatus(orderId, 'cancelled');
      showNotification('订单已取消', 'success');
      loadData();
    } catch (error) {
      console.error('取消订单失败:', error);
      showNotification('取消订单失败', 'error');
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
          <div className="stat-value">{trades?.length || 0}</div>
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
      <h2 className="section-title">现货交易</h2>
      <div className="trading-interface">
        <div className="trading-form buy-form">
          <div className="trading-header">
            <h3>买入</h3>
            <div className="price-display">
              <div className="current-price">市价交易</div>
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
            <label>价格 (USDT)</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="输入价格"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(buyAmount, buyPrice, 0)}
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
              <div className="current-price">市价交易</div>
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
            <label>价格 (USDT)</label>
            <input
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="输入价格"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(sellAmount, sellPrice, 0)}
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

  const renderOrders = () => (
    <>
      <h2 className="section-title">订单管理</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>交易对</th>
              <th>类型</th>
              <th>数量</th>
              <th>价格</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">暂无待处理订单</td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td>{new Date(order.timestamp).toLocaleString()}</td>
                  <td>{order.pair}</td>
                  <td className={order.type === 'buy' ? 'type-buy' : 'type-sell'}>
                    {order.type === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td>{order.amount}</td>
                  <td>${order.price.toFixed(2)}</td>
                  <td className={`status-${order.status}`}>
                    {order.status === 'completed' ? '已完成' : order.status === 'pending' ? '待处理' : '已取消'}
                  </td>
                  <td>
                    {order.status === 'pending' && (
                      <button className="btn btn-danger" onClick={() => cancelOrder(order.id)}>
                        取消
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPortfolio = () => (
    <>
      <h2 className="section-title">资产组合</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">+5.2%</div>
          <div className="stat-label">24小时变化</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value">0</div>
          <div className="stat-label">持有币种</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">均衡</div>
          <div className="stat-label">资产配置</div>
        </div>
      </div>
      <div className="table-container">
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
            <tr>
              <td colSpan={5} className="empty-state">暂无资产数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  const renderHistory = () => (
    <>
      <h2 className="section-title">交易历史</h2>
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
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">暂无交易记录</td>
              </tr>
            ) : (
              trades.map(trade => (
                <tr key={trade.id}>
                  <td>{new Date(trade.timestamp).toLocaleString()}</td>
                  <td>{trade.pair}</td>
                  <td className={trade.type === 'buy' ? 'type-buy' : 'type-sell'}>
                    {trade.type === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td>{trade.amount}</td>
                  <td>${trade.price.toFixed(2)}</td>
                  <td>${trade.total.toFixed(2)}</td>
                  <td>${trade.fee.toFixed(2)}</td>
                  <td className={`status-${trade.status}`}>
                    {trade.status === 'completed' ? '已完成' : trade.status === 'pending' ? '待处理' : '已取消'}
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
        {activeSection === 'orders' && renderOrders()}
        {activeSection === 'portfolio' && renderPortfolio()}
        {activeSection === 'history' && renderHistory()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}
