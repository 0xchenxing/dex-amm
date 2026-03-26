import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { useNotification } from '../hooks/useNotification';
import { liquidityPoolAPI, systemLogAPI, userAPI } from '../services/apiService';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { Contract, BrowserProvider, JsonRpcProvider, formatUnits } from 'ethers';
import type { SystemLog, LiquidityPool, User } from '../types/index';
import './AdminDashboard.css';

/** 链上交易记录 */
interface ChainTrade {
  txHash: string;
  timestamp: number;
  user: string;  // to 地址：实际执行 swap 的用户钱包
  pairLabel: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  tokenIn: string;
  tokenOut: string;
}

const navItems: Array<{ key: string; label: string; icon: string }> = [
  { key: 'overview', label: '系统概览', icon: '📊' },
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'trades', label: '交易监控', icon: '💱' },
  { key: 'liquidity', label: '流动性管理', icon: '💧' },
  { key: 'security', label: '安全管理', icon: '🔒' },
  { key: 'settings', label: '系统设置', icon: '⚙️' },
];

export function AdminDashboard() {
  const { showNotification, NotificationComponent } = useNotification();
  const [activeSection, setActiveSection] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [trades, setTrades] = useState<ChainTrade[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [newPool, setNewPool] = useState({
    token1: '',
    token1Address: '',
    token2: '',
    token2Address: ''
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
      const [poolsResult, logsResult, usersResult] = await Promise.allSettled([
        liquidityPoolAPI.getAll(),
        systemLogAPI.getAll(),
        userAPI.getAll()
      ]);

      if (poolsResult.status === 'fulfilled') {
        setPools(Array.isArray(poolsResult.value) ? poolsResult.value : []);
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

  const loadTradesData = useCallback(async () => {
    if (loading.trades) return;

    setLoading(prev => ({ ...prev, trades: true }));
    try {
      let provider;
      if (typeof window !== 'undefined' && window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
      } else {
        provider = new JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      }
      const factory = new Contract(CONTRACT_ADDRESSES.DEXAMM_FACTORY, [
        'function allPairs(uint256) external view returns (address)',
        'function allPairsLength() external view returns (uint256)',
      ], provider);

      const swapAbi = [
        'function token0() external view returns (address)',
        'function token1() external view returns (address)',
        'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
      ];

      const erc20Abi = [
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)',
      ];

      const pairCount = Number(await factory.allPairsLength());
      const allTrades: ChainTrade[] = [];

      for (let i = 0; i < pairCount; i++) {
        try {
          const pairAddress = await factory.allPairs(i);
          const pairContract = new Contract(pairAddress, swapAbi, provider);
          const [token0Addr, token1Addr] = await Promise.all([
            pairContract.token0(),
            pairContract.token1(),
          ]);

          const token0Contract = new Contract(token0Addr, erc20Abi, provider);
          const token1Contract = new Contract(token1Addr, erc20Abi, provider);
          const [symbol0, symbol1, decimals0, decimals1] = await Promise.all([
            token0Contract.symbol().catch(() => 'T0'),
            token1Contract.symbol().catch(() => 'T1'),
            token0Contract.decimals().catch(() => 18),
            token1Contract.decimals().catch(() => 18),
          ]);

          const pairLabel = `${symbol0}/${symbol1}`;

          const swapLogs = await pairContract.queryFilter(
            pairContract.filters.Swap()
          );

          for (const log of swapLogs) {
            try {
              const parsed = pairContract.interface.parseLog(log);
              if (!parsed || parsed.name !== 'Swap') continue;

              const amount0In = parsed.args[1] as bigint;
              const amount1In = parsed.args[2] as bigint;
              const amount0Out = parsed.args[3] as bigint;
              const amount1Out = parsed.args[4] as bigint;
              const to = parsed.args[5] as string;  // 接收方 = 实际执行 swap 的用户钱包（sender 是 Router）

              const block = await provider.getBlock(log.blockNumber);
              const timestamp = block?.timestamp ?? 0;

              if (amount0In > 0n && amount1Out > 0n) {
                const amount0InHuman = Number(formatUnits(amount0In, decimals0));
                const amount1OutHuman = Number(formatUnits(amount1Out, decimals1));
                const amount = amount1OutHuman;
                const total = amount0InHuman;
                const price = amount > 0 ? total / amount : 0;
                allTrades.push({
                  txHash: log.transactionHash,
                  timestamp,
                  user: to,
                  pairLabel,
                  type: 'buy',
                  amount,
                  price,
                  total,
                  tokenIn: symbol0,
                  tokenOut: symbol1,
                });
              } else if (amount1In > 0n && amount0Out > 0n) {
                const amount1InHuman = Number(formatUnits(amount1In, decimals1));
                const amount0OutHuman = Number(formatUnits(amount0Out, decimals0));
                const amount = amount0OutHuman;
                const total = amount1InHuman;
                const price = amount > 0 ? total / amount : 0;
                allTrades.push({
                  txHash: log.transactionHash,
                  timestamp,
                  user: to,
                  pairLabel,
                  type: 'sell',
                  amount,
                  price,
                  total,
                  tokenIn: symbol1,
                  tokenOut: symbol0,
                });
              }
            } catch {
              // skip unparsable
            }
          }
        } catch (e) {
          console.warn('获取池子交易失败:', i, e);
        }
      }

      allTrades.sort((a, b) => b.timestamp - a.timestamp);
      setTrades(allTrades);
    } catch (error) {
      console.error('加载链上交易失败:', error);
      const msg = error instanceof Error && error.message.includes('fetch')
        ? '加载链上交易失败，请连接 MetaMask 并切换到 Sepolia 网络'
        : `加载链上交易失败: ${error instanceof Error ? error.message : '未知错误'}`;
      showNotification(msg, 'error');
      setTrades([]);
    } finally {
      setLoading(prev => ({ ...prev, trades: false }));
    }
  }, [showNotification]);

  const loadLiquidityPoolsData = async () => {
    if (loading.liquidity) return;
    
    setLoading(prev => ({ ...prev, liquidity: true }));
    try {
      const pools = await liquidityPoolAPI.getAll();
      setPools(Array.isArray(pools) ? pools : []);
    } catch (error) {
      console.error('加载流动性池数据失败:', error);
      showNotification('加载流动性池数据失败', 'error');
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
        loadLiquidityPoolsData();
        break;
      case 'security':
        loadSecurityData();
        break;
      default:
        break;
    }
  }, [activeSection, loadTradesData]);

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

  const createLiquidityPool = async () => {
    if (!newPool.token1 || !newPool.token1Address || !newPool.token2 || !newPool.token2Address || newPool.token1 === newPool.token2) {
      showNotification('请输入有效的代币信息', 'error');
      return;
    }

    setIsCreatingPool(true);
    try {
      const pair = `${newPool.token1}-${newPool.token2}`;
      const liquidityPool: LiquidityPool = {
        id: pair,
        pair: pair,
        token1: newPool.token1,
        token2: newPool.token2,
        token1Address: newPool.token1Address,
        token2Address: newPool.token2Address,
        reserve1: 0,
        reserve2: 0,
        totalSupply: 0,
        status: 'active'
      };

      await liquidityPoolAPI.create(liquidityPool);
      await loadLiquidityPoolsData();
      setNewPool({ token1: '', token1Address: '', token2: '', token2Address: '' });
      showNotification('流动性池创建成功', 'success');
    } catch (error) {
      console.error('创建流动性池失败:', error);
      showNotification('创建流动性池失败，请稍后重试', 'error');
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
        <div className="trades-header">
          <span className="trades-hint">数据直接从链上读取（Sepolia 网络，请连接钱包）</span>
          <button
            className="btn btn-primary"
            onClick={loadTradesData}
            disabled={loading.trades}
          >
            {loading.trades ? '加载中...' : '刷新'}
          </button>
        </div>
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
              {loading.trades && trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="loading-cell">正在从链上加载交易数据...</td>
                </tr>
              ) : trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">暂无链上交易记录</td>
                </tr>
              ) : (
                trades.map((trade, idx) => (
                  <tr key={`${trade.txHash}-${idx}`}>
                    <td>{new Date(trade.timestamp * 1000).toLocaleString()}</td>
                    <td title={trade.user}>{formatAddress(trade.user)}</td>
                    <td>{trade.pairLabel}</td>
                    <td className={trade.type === 'buy' ? 'type-buy' : 'type-sell'}>
                      {trade.type === 'buy' ? '买入' : '卖出'}
                    </td>
                    <td>{trade.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                    <td>${trade.price.toFixed(4)}</td>
                    <td className="status-completed">已完成</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderLiquidityPools = () => {
    return (
      <>
        <h2 className="section-title">流动性管理</h2>
        
        <div className="card">
          <h3 className="card-title">创建流动性池</h3>
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
                value={newPool.token1Address}
                onChange={(e) => setNewPool({ ...newPool, token1Address: e.target.value })}
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
                value={newPool.token2Address}
                onChange={(e) => setNewPool({ ...newPool, token2Address: e.target.value })}
                placeholder="例如: 0x..."
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <button 
                className="btn btn-primary" 
                onClick={createLiquidityPool}
                disabled={isCreatingPool}
              >
                {isCreatingPool ? '创建中...' : '创建流动性池'}
              </button>
            </div>
          </div>
        </div>

        <h3 className="section-subtitle">现有流动性池</h3>
        <div className="pools-grid">
          {pools.map(pool => {
            if (!pool.pair || !pool.token1 || !pool.token2) return null;
            
            return (
              <div key={pool.id} className="pool-admin-card">
                <h3>{pool.pair}</h3>
                <div className="pool-admin-stats">
                  <div className="admin-stat">
                    <span>代币1</span>
                    <span>{pool.token1}</span>
                  </div>
                  <div className="admin-stat">
                    <span>代币1地址</span>
                    <span>{formatAddress(pool.token1Address) || '-'}</span>
                  </div>
                  <div className="admin-stat">
                    <span>代币2</span>
                    <span>{pool.token2}</span>
                  </div>
                  <div className="admin-stat">
                    <span>代币2地址</span>
                    <span>{formatAddress(pool.token2Address) || '-'}</span>
                  </div>
                  <div className="admin-stat">
                    <span>储备1</span>
                    <span>{pool.reserve1.toLocaleString()}</span>
                  </div>
                  <div className="admin-stat">
                    <span>储备2</span>
                    <span>{pool.reserve2.toLocaleString()}</span>
                  </div>
                  <div className="admin-stat">
                    <span>总供应</span>
                    <span>{pool.totalSupply.toLocaleString()}</span>
                  </div>
                  <div className="admin-stat">
                    <span>状态</span>
                    <span className={`status-badge ${pool.status}`}>
                      {pool.status === 'active' ? '活跃' : '非活跃'}
                    </span>
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
        {activeSection === 'liquidity' && renderLiquidityPools()}
        {activeSection === 'security' && renderSecurity()}
        {activeSection === 'settings' && renderSettings()}
      </div>

      {NotificationComponent}
    </Layout>
  );
}

