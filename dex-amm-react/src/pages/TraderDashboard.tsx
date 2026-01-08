import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { tradingPairStorage, tradeStorage, userStorage } from '../services/storage';
import type { Trade, TradingPair } from '../types';
import './TraderDashboard.css';

const navItems: Array<{ path: string; label: string; icon: string }> = [];

export function TraderDashboard() {
  const { user } = useAuth();
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Trade[]>([]);

  // 交易表单状态
  const [buyPair, setBuyPair] = useState('ETH-USDT');
  const [buyAmount, setBuyAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPair, setSellPair] = useState('ETH-USDT');
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const pairs = tradingPairStorage.getAll();
    setTradingPairs(pairs);
    
    if (user) {
      const userTrades = tradeStorage.getByUser(user.username);
      setTrades(userTrades);
      setOrders(userTrades.filter(t => t.status === 'pending'));
    }
  };

  const getCurrentPrice = (pairId: string) => {
    const pair = tradingPairs.find(p => p.id === pairId);
    return pair?.price || 0;
  };

  const calculateTotal = (amount: string, price: string, pairPrice: number) => {
    const amt = parseFloat(amount) || 0;
    const prc = parseFloat(price) || pairPrice;
    return (amt * prc).toFixed(2);
  };

  const executeTrade = (type: 'buy' | 'sell') => {
    if (!user) return;

    const pair = type === 'buy' ? buyPair : sellPair;
    const amount = type === 'buy' ? buyAmount : sellAmount;
    const price = type === 'buy' ? buyPrice : sellPrice;
    const pairData = tradingPairs.find(p => p.id === pair);

    if (!amount || parseFloat(amount) <= 0) {
      showNotification('请输入有效的交易数量', 'error');
      return;
    }

    if (!pairData) {
      showNotification('交易对不存在', 'error');
      return;
    }

    const tradePrice = price ? parseFloat(price) : pairData.price;
    const total = parseFloat(amount) * tradePrice;
    const fee = total * pairData.fee;

    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      user: user.username,
      pair,
      type,
      amount: parseFloat(amount),
      price: tradePrice,
      total,
      fee,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };

    // 更新用户余额
    const updatedUser = { ...user };
    const [baseToken, quoteToken] = pair.split('-');
    
    if (type === 'buy') {
      updatedUser.balance[baseToken] = (updatedUser.balance[baseToken] || 0) + parseFloat(amount);
      updatedUser.balance[quoteToken] = (updatedUser.balance[quoteToken] || 0) - total - fee;
    } else {
      updatedUser.balance[baseToken] = (updatedUser.balance[baseToken] || 0) - parseFloat(amount);
      updatedUser.balance[quoteToken] = (updatedUser.balance[quoteToken] || 0) + total - fee;
    }

    userStorage.update(updatedUser);
    tradeStorage.add(newTrade);
    loadData();

    showNotification(`${type === 'buy' ? '买入' : '卖出'}成功`, 'success');
    
    // 重置表单
    if (type === 'buy') {
      setBuyAmount('');
      setBuyPrice('');
    } else {
      setSellAmount('');
      setSellPrice('');
    }
  };

  const cancelOrder = (orderId: string) => {
    const order = tradeStorage.getById(orderId);
    if (order) {
      order.status = 'cancelled';
      tradeStorage.update(order);
      showNotification('订单已取消', 'success');
      loadData();
    }
  };

  const calculateTotalBalance = () => {
    if (!user) return 0;
    let total = 0;
    Object.entries(user.balance).forEach(([token, amount]) => {
      const pair = tradingPairs.find(p => 
        p.baseToken === token || p.quoteToken === token
      );
      if (pair && token === pair.baseToken) {
        total += amount * pair.price;
      } else if (token === 'USDT' || token === 'DAI') {
        total += amount;
      }
    });
    return total;
  };

  const renderOverview = () => (
    <>
      <h2 className="section-title">交易概览</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">${calculateTotalBalance().toFixed(2)}</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">+$245.30</div>
          <div className="stat-label">今日盈亏</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{trades.length}</div>
          <div className="stat-label">总交易次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">68.5%</div>
          <div className="stat-label">胜率</div>
        </div>
      </div>
      <div className="balance-grid">
        {user && Object.entries(user.balance).map(([token, amount]) => (
          <div key={token} className="balance-card">
            <div className="balance-token">{token}</div>
            <div className="balance-amount">{amount.toFixed(4)}</div>
          </div>
        ))}
      </div>
    </>
  );

  const renderTrading = () => (
    <>
      <h2 className="section-title">现货交易</h2>
      <div className="trading-interface">
        <div className="trading-form">
          <h3 style={{ marginBottom: '20px', color: '#4CAF50' }}>买入</h3>
          <div className="form-group">
            <label>交易对</label>
            <select value={buyPair} onChange={(e) => setBuyPair(e.target.value)}>
              {tradingPairs.map(pair => (
                <option key={pair.id} value={pair.id}>
                  {pair.baseToken}/{pair.quoteToken}
                </option>
              ))}
            </select>
          </div>
          <div className="price-display">
            <div className="current-price">${getCurrentPrice(buyPair).toFixed(2)}</div>
            <div className="price-change price-up">
              +2.5% (24h)
            </div>
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
              placeholder="市价"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(buyAmount, buyPrice, getCurrentPrice(buyPair))}
              readOnly
              placeholder="自动计算"
            />
          </div>
          <button className="trade-btn buy-btn" onClick={() => executeTrade('buy')}>
            买入
          </button>
        </div>
        <div className="trading-form">
          <h3 style={{ marginBottom: '20px', color: '#e74c3c' }}>卖出</h3>
          <div className="form-group">
            <label>交易对</label>
            <select value={sellPair} onChange={(e) => setSellPair(e.target.value)}>
              {tradingPairs.map(pair => (
                <option key={pair.id} value={pair.id}>
                  {pair.baseToken}/{pair.quoteToken}
                </option>
              ))}
            </select>
          </div>
          <div className="price-display">
            <div className="current-price">${getCurrentPrice(sellPair).toFixed(2)}</div>
            <div className="price-change price-up">
              +2.5% (24h)
            </div>
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
              placeholder="市价"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label>总计 (USDT)</label>
            <input
              type="number"
              value={calculateTotal(sellAmount, sellPrice, getCurrentPrice(sellPair))}
              readOnly
              placeholder="自动计算"
            />
          </div>
          <button className="trade-btn sell-btn" onClick={() => executeTrade('sell')}>
            卖出
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
            {orders.map(order => (
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
            ))}
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
          <div className="stat-value">${calculateTotalBalance().toFixed(2)}</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">+5.2%</div>
          <div className="stat-label">24小时变化</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{user ? Object.keys(user.balance).length : 0}</div>
          <div className="stat-label">持有币种</div>
        </div>
        <div className="stat-card">
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
              <th>价格</th>
              <th>价值 (USDT)</th>
              <th>24h变化</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {user && Object.entries(user.balance).map(([token, amount]) => {
              const pair = tradingPairs.find(p => p.baseToken === token);
              const price = pair?.price || 1;
              const value = token === pair?.baseToken ? amount * price : amount;
              const total = calculateTotalBalance();
              const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0';
              
              return (
                <tr key={token}>
                  <td>{token}</td>
                  <td>{amount.toFixed(4)}</td>
                  <td>${price.toFixed(2)}</td>
                  <td>${value.toFixed(2)}</td>
                  <td className="price-up">+2.5%</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
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
            {trades.map(trade => (
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <Layout navItems={navItems}>
      <div className="header">
        <h1 className="header-title">交易者仪表板</h1>
      </div>

      <div className="section-tabs">
        <button
          className={`tab-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          交易概览
        </button>
        <button
          className={`tab-btn ${activeSection === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveSection('trading')}
        >
          现货交易
        </button>
        <button
          className={`tab-btn ${activeSection === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveSection('orders')}
        >
          订单管理
        </button>
        <button
          className={`tab-btn ${activeSection === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveSection('portfolio')}
        >
          资产组合
        </button>
        <button
          className={`tab-btn ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          交易历史
        </button>
      </div>

      <div className="content-section">
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

