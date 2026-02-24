import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolAPI, tradingPairAPI, tradeAPI, systemLogAPI, userAPI } from '../services/apiService';
import type { SystemLog, LiquidityPool, User, TradingPair } from '../types/index';
import './AdminDashboard.css';

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '系统概览', icon: '📊' },
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'trades', label: '交易监控', icon: '💱' },
  { key: 'liquidity', label: '交易对管理', icon: '💧' },
  { key: 'security', label: '安全管理', icon: '🔒' },
  { key: 'settings', label: '系统设置', icon: '⚙️' },
];

export function AdminDashboard() {
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [pools, setPools] = useState<TradingPair[]>([]);
  const [newPool, setNewPool] = useState({
    token1: '',
    token2: '',
    token1Addr: '',
    token2Addr: '',
    apy: 0
  });
  const [isCreatingPool, setIsCreatingPool] = useState(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    if (loading.overview) return;
    
    setLoading(prev => ({ ...prev, overview: true }));
    try {
      const [pairsResult, logsResult, usersResult] = await Promise.allSettled([
        tradingPairAPI.getAll(),
        systemLogAPI.getAll(),
        userAPI.getAll()
      ]);

      if (pairsResult.status === 'fulfilled') {
        setPools(Array.isArray(pairsResult.value) ? pairsResult.value : []);
      }

      if (logsResult.status === 'fulfilled' && logsResult.value) {
        setLogs(Array.isArray(logsResult.value) ? logsResult.value.slice(0, 50) : []);
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(Array.isArray(usersResult.value) ? usersResult.value : []);
      }
    } catch (error) {
      console.error('加载概览数据失败:', error);
      showNotification('加载概览数据失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const loadUsersData = async () => {
    if (loading.users) return;
    
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const users = await userAPI.getAll();
      setUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      showNotification('加载用户数据失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const loadTradesData = async () => {
    if (loading.trades) return;
    
    setLoading(prev => ({ ...prev, trades: true }));
    try {
      const trades = await tradeAPI.getAll();
      setTrades(Array.isArray(trades) ? trades : []);
    } catch (error) {
      console.error('加载交易数据失败:', error);
      showNotification('加载交易数据失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, trades: false }));
    }
  };

  const loadTradingPairsData = async () => {
    if (loading.liquidity) return;
    
    setLoading(prev => ({ ...prev, liquidity: true }));
    try {
      const pairs = await tradingPairAPI.getAll();
      setPools(Array.isArray(pairs) ? pairs : []);
    } catch (error) {
      console.error('加载交易对数据失败:', error);
      showNotification('加载交易对数据失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, liquidity: false }));
    }
  };

  const loadSecurityData = async () => {
    if (loading.security) return;
    
    setLoading(prev => ({ ...prev, security: true }));
    try {
      const logs = await systemLogAPI.getAll();
      setLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error('加载安全数据失败:', error);
      showNotification('加载安全数据失败', 'error');
    } finally {
      setLoading(prev => ({ ...prev, security: false }));
    }
  };

  useEffect(() => {
    switch (activeSection) {
      case 'overview':
        loadOverviewData();
        break;
      case 'users':
        loadUsersData();
        break;
      case 'trades':
        loadTradesData();
        break;
      case 'liquidity':
        loadTradingPairsData();
        break;
      case 'security':
        loadSecurityData();
        break;
      default:
        break;
    }
  }, [activeSection]);

  const toggleUserStatus = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userAPI.updateStatus(userId, newStatus);
      await loadUsersData();
      showNotification('用户状态已更新', 'success');
    } catch (error) {
      console.error('更新用户状态失败:', error);
      showNotification('更新用户状态失败，请稍后重试', 'error');
    }
  };

  const createTradingPair = async () => {
    if (!newPool.token1 || !newPool.token2 || newPool.token1 === newPool.token2) {
      showNotification('请输入有效的代币对', 'error');
      return;
    }

    setIsCreatingPool(true);
    try {
      const pairId = `${newPool.token1}-${newPool.token2}`;
      const tradingPair: TradingPair = {
        id: pairId,
        baseToken: newPool.token1,
        quoteToken: newPool.token2,
        baseTokenAddr: newPool.token1Addr,
        quoteTokenAddr: newPool.token2Addr
      };

      await tradingPairAPI.create(tradingPair);
      await loadTradingPairsData();
      setNewPool({ token1: '', token2: '', token1Addr: '', token2Addr: '', apy: 0 });
      showNotification('交易对创建成功', 'success');
    } catch (error) {
      console.error('创建交易对失败:', error);
      showNotification('创建交易对失败，请稍后重试', 'error');
    } finally {
      setIsCreatingPool(false);
    }
  };



  const renderOverview = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalTrades = trades.length;
    const totalPools = pools.length;

    return (
      <>
        <h2 className="section-title">系统概览</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">总用户数</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{activeUsers}</div>
            <div className="stat-label">活跃用户</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💱</div>
            <div className="stat-value">{totalTrades}</div>
            <div className="stat-label">总交易数</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <div className="stat-value">{totalPools}</div>
            <div className="stat-label">交易对</div>
          </div>
        </div>

        <div className="recent-logs">
          <h3>最近系统日志</h3>
          <div className="logs-list">
            {logs.slice(0, 10).map(log => (
              <div key={log.id} className={`log-item log-${log.level}`}>
                <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                <span className="log-category">{log.category}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  const renderUsers = () => {
    const filteredUsers = searchUser
      ? users.filter(u => 
          u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
          u.email.toLowerCase().includes(searchUser.toLowerCase())
        )
      : users;

    return (
      <>
        <h2 className="section-title">用户管理</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>最后登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`status-badge ${u.status || 'active'}`}>
                      {u.status === 'active' ? '活跃' : '非活跃'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '从未登录'}</td>
                  <td>
                    <button
                      className="btn btn-primary"
                      onClick={() => toggleUserStatus(u.id)}
                    >
                      {u.status === 'active' ? '禁用' : '启用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // 格式化代币地址显示
  const formatAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const renderTrades = () => {
    return (
      <>
        <h2 className="section-title">交易监控</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>交易对</th>
                <th>类型</th>
                <th>数量</th>
                <th>价格</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id}>
                  <td>{new Date(trade.timestamp).toLocaleString()}</td>
                  <td>{trade.userUsername || trade.user}</td>
                  <td>{trade.pair}</td>
                  <td className={trade.type === 'buy' ? 'type-buy' : 'type-sell'}>
                    {trade.type === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td>{trade.amount}</td>
                  <td>${trade.price.toFixed(2)}</td>
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
  };

  const renderTradingPairs = () => {
    return (
      <>
        <h2 className="section-title">交易对管理</h2>
        
        <div className="card">
          <h3 className="card-title">创建交易对</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>代币1</label>
              <input
                type="text"
                value={newPool.token1}
                onChange={(e) => setNewPool({ ...newPool, token1: e.target.value.toUpperCase() })}
                placeholder="例如: ETH"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>代币1地址</label>
              <input
                type="text"
                value={newPool.token1Addr}
                onChange={(e) => setNewPool({ ...newPool, token1Addr: e.target.value })}
                placeholder="例如: 0x..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>代币2</label>
              <input
                type="text"
                value={newPool.token2}
                onChange={(e) => setNewPool({ ...newPool, token2: e.target.value.toUpperCase() })}
                placeholder="例如: USDT"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>代币2地址</label>
              <input
                type="text"
                value={newPool.token2Addr}
                onChange={(e) => setNewPool({ ...newPool, token2Addr: e.target.value })}
                placeholder="例如: 0x..."
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <button 
                className="btn btn-primary" 
                onClick={createTradingPair}
                disabled={isCreatingPool}
              >
                {isCreatingPool ? '创建中...' : '创建交易对'}
              </button>
            </div>
          </div>
        </div>

        <h3 className="section-subtitle">现有交易对</h3>
        <div className="pools-grid">
          {pools.map(pair => {
            if (!pair.baseToken || !pair.quoteToken) return null;
            
            return (
              <div key={pair.id} className="pool-admin-card">
                <h3>{pair.baseToken}/{pair.quoteToken}</h3>
                <div className="pool-admin-stats">
                  <div className="admin-stat">
                    <span>基础代币</span>
                    <span>{pair.baseToken}</span>
                  </div>
                  <div className="admin-stat">
                    <span>基础代币地址</span>
                    <span>{formatAddress(pair.baseTokenAddr) || '-'}</span>
                  </div>
                  <div className="admin-stat">
                    <span>报价代币</span>
                    <span>{pair.quoteToken}</span>
                  </div>
                  <div className="admin-stat">
                    <span>报价代币地址</span>
                    <span>{formatAddress(pair.quoteTokenAddr) || '-'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderSecurity = () => {
    const securityLogs = logs.filter(log => log.category === 'security');
    return (
      <>
        <h2 className="section-title">安全管理</h2>
        <div className="security-stats">
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-value">{securityLogs.length}</div>
            <div className="stat-label">安全事件</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-value">{securityLogs.filter(l => l.level === 'warning').length}</div>
            <div className="stat-label">警告事件</div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>级别</th>
                <th>消息</th>
              </tr>
            </thead>
            <tbody>
              {securityLogs.map(log => (
                <tr key={log.id} className={`log-${log.level}`}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`log-level-badge ${log.level}`}>
                      {log.level}
                    </span>
                  </td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderSettings = () => (
    <>
      <h2 className="section-title">系统设置</h2>
      <div className="settings-grid">
        <div className="setting-card">
          <h3>协议参数</h3>
          <div className="setting-item">
            <span>交易手续费率</span>
            <span>0.3%</span>
            <button className="btn btn-primary">修改</button>
          </div>
          <div className="setting-item">
            <span>流动性要求</span>
            <span>$10,000</span>
            <button className="btn btn-primary">修改</button>
          </div>
        </div>
        <div className="setting-card">
          <h3>系统控制</h3>
          <div className="setting-item">
            <span>系统状态</span>
            <span className="status-badge active">运行中</span>
            <button className="btn btn-danger">维护模式</button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Layout 
      navItems={navItems} 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
      dashboardTitle="管理员仪表板"
    >
      {/* 钱包连接状态已移至顶部导航栏 */}

      <div className="content-section glass fade-in">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'trades' && renderTrades()}
        {activeSection === 'liquidity' && renderTradingPairs()}
        {activeSection === 'security' && renderSecurity()}
        {activeSection === 'settings' && renderSettings()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

