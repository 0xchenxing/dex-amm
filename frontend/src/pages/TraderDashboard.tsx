import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { tradingPairStorage, tradeStorage, userStorage } from '../services/storage';
import { connectToEthereum, getAccountAddress, executeUniswapTrade } from '../services/contractService';
import type { Trade, TradingPair } from '../types';
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
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Trade[]>([]);
  
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
      const provider = await connectToEthereum();
      if (provider) {
        const address = await getAccountAddress();
        if (address) {
          setEthereumAddress(address);
          setIsConnected(true);
          showNotification('成功连接到MetaMask', 'success');
        }
      }
    } catch (error) {
      console.error('连接MetaMask失败:', error);
      showNotification('连接MetaMask失败', 'error');
    }
  };

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

  const executeTrade = async (type: 'buy' | 'sell') => {
    if (!user || !isConnected || !ethereumAddress) {
      showNotification('请先连接MetaMask钱包', 'error');
      connectToMetaMask();
      return;
    }

    setIsLoading(true);

    try {
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

      const newTrade = await executeUniswapTrade(
        pair,
        type,
        parseFloat(amount),
        tradePrice,
        ethereumAddress
      );

      if (!newTrade) {
        showNotification(`${type === 'buy' ? '买入' : '卖出'}失败`, 'error');
        return;
      }

      const updatedUser = { ...user };
      const [baseToken, quoteToken] = pair.split('-');
      const total = newTrade.total;
      const fee = newTrade.fee;
      
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
          <div className="stat-icon">💰</div>
          <div className="stat-value">${calculateTotalBalance().toFixed(2)}</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">+$245.30</div>
          <div className="stat-label">今日盈亏</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{trades.length}</div>
          <div className="stat-label">总交易次数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
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
        <div className="trading-form buy-form">
          <div className="trading-header">
            <h3>买入</h3>
            <div className="price-display">
              <div className="current-price">${getCurrentPrice(buyPair).toFixed(2)}</div>
              <div className="price-change positive">+2.5% (24h)</div>
            </div>
          </div>
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
              <div className="current-price">${getCurrentPrice(sellPair).toFixed(2)}</div>
              <div className="price-change positive">+2.5% (24h)</div>
            </div>
          </div>
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
          <div className="stat-value">${calculateTotalBalance().toFixed(2)}</div>
          <div className="stat-label">总资产价值</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-value positive">+5.2%</div>
          <div className="stat-label">24小时变化</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value">{user ? Object.keys(user.balance).length : 0}</div>
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
                  <td><strong>{token}</strong></td>
                  <td>{amount.toFixed(4)}</td>
                  <td>${price.toFixed(2)}</td>
                  <td>${value.toFixed(2)}</td>
                  <td className="positive">+2.5%</td>
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

