import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';

import { useNotification } from '../hooks/useNotification';
import { userStorage, tradeStorage, systemLogStorage, liquidityPoolStorage } from '../services/storage';
import type { SystemLog } from '../types';
import './AdminDashboard.css';

const navItems: Array<{ path: string; label: string; icon: string }> = [];

export function AdminDashboard() {

  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [users, setUsers] = useState(userStorage.getAll());
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(userStorage.getAll());
    setLogs(systemLogStorage.getAll().slice(0, 50));
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' as const : 'active' as const } : u
    );
    setUsers(updatedUsers);
    showNotification('用户状态已更新', 'success');
  };

  const renderOverview = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalTrades = tradeStorage.getAll().length;
    const totalPools = liquidityPoolStorage.getAll().length;

    return (
      <>
        <h2 className="section-title">系统概览</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">总用户数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeUsers}</div>
            <div className="stat-label">活跃用户</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalTrades}</div>
            <div className="stat-label">总交易数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalPools}</div>
            <div className="stat-label">流动性池</div>
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
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`status-badge ${u.status || 'active'}`}>
                      {u.status === 'active' ? '活跃' : '非活跃'}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(u.lastLogin).toLocaleString()}</td>
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

  const renderTrades = () => {
    const trades = tradeStorage.getAll().slice(0, 50);
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
                  <td>{trade.user}</td>
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

  const renderLiquidity = () => {
    const pools = liquidityPoolStorage.getAll();
    return (
      <>
        <h2 className="section-title">流动性管理</h2>
        <div className="pools-grid">
          {pools.map(pool => (
            <div key={pool.id} className="pool-admin-card">
              <h3>{pool.pair}</h3>
              <div className="pool-admin-stats">
                <div className="admin-stat">
                  <span>总流动性</span>
                  <span>${pool.totalLiquidity.toLocaleString()}</span>
                </div>
                <div className="admin-stat">
                  <span>24h交易量</span>
                  <span>${pool.volume24h.toLocaleString()}</span>
                </div>
                <div className="admin-stat">
                  <span>APY</span>
                  <span>{pool.apy}%</span>
                </div>
              </div>
              <button className="btn btn-primary">管理池子</button>
            </div>
          ))}
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
            <div className="stat-value">{securityLogs.length}</div>
            <div className="stat-label">安全事件</div>
          </div>
          <div className="stat-card">
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
    <Layout navItems={navItems}>
      <div className="header">
        <h1 className="header-title">管理员仪表板</h1>
      </div>

      <div className="section-tabs">
        <button
          className={`tab-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          系统概览
        </button>
        <button
          className={`tab-btn ${activeSection === 'users' ? 'active' : ''}`}
          onClick={() => setActiveSection('users')}
        >
          用户管理
        </button>
        <button
          className={`tab-btn ${activeSection === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveSection('trades')}
        >
          交易监控
        </button>
        <button
          className={`tab-btn ${activeSection === 'liquidity' ? 'active' : ''}`}
          onClick={() => setActiveSection('liquidity')}
        >
          流动性管理
        </button>
        <button
          className={`tab-btn ${activeSection === 'security' ? 'active' : ''}`}
          onClick={() => setActiveSection('security')}
        >
          安全管理
        </button>
        <button
          className={`tab-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          系统设置
        </button>
      </div>

      <div className="content-section">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'users' && renderUsers()}
        {activeSection === 'trades' && renderTrades()}
        {activeSection === 'liquidity' && renderLiquidity()}
        {activeSection === 'security' && renderSecurity()}
        {activeSection === 'settings' && renderSettings()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

