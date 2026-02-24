import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';
import './Login.css';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showNotification, NotificationComponent } = useNotification();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!username || !password || !role) {
      showNotification('请填写完整的登录信息', 'error');
      return;
    }

    const result = await login(username, password, role);

    if (result.success) {
      showNotification('登录成功，正在跳转...', 'success');
      setTimeout(() => {
        switch (role) {
          case 'trader':
            navigate('/trader');
            break;
          case 'liquidity':
            navigate('/liquidity');
            break;
          case 'governor':
            navigate('/governor');
            break;
          case 'arbitrageur':
            navigate('/arbitrageur');
            break;
          case 'admin':
            navigate('/admin');
            break;
          default:
            showNotification('未知角色类型', 'error');
        }
      }, 1500);
    } else {
      showNotification(result.error || '登录失败，请重试', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
        <div className="bg-shape shape-4"></div>
      </div>

      <div className="login-content">
        <div className="login-card glass fade-in">
          <div className="login-header">
            <div className="login-logo">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path d="M32 4L8 16L32 28L56 16L32 4Z" fill="url(#gradient1)" />
                <path d="M8 16L32 28L56 16L32 40L8 28L8 16Z" fill="url(#gradient2)" />
                <path d="M32 40L56 28L56 48L32 60L8 48L8 28L32 40Z" fill="url(#gradient3)" />
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea" />
                    <stop offset="100%" stopColor="#764ba2" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#764ba2" />
                    <stop offset="100%" stopColor="#f093fb" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f093fb" />
                    <stop offset="100%" stopColor="#4facfe" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="login-title">DEX-AMM</h1>
            <p className="login-subtitle">去中心化交易所自动做市商平台</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">角色选择</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">请选择角色</option>
                <option value="trader">交易者</option>
                <option value="liquidity">流动性提供者</option>
                <option value="governor">治理者</option>
                <option value="arbitrageur">套利者</option>
                <option value="admin">系统管理员</option>
              </select>
            </div>

            <button type="submit" className="login-btn btn-primary">
              <span>登录系统</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>自动做市商（AMM）机制</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <span>流动性挖矿与收益农场</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🗳️</div>
              <span>去中心化治理投票</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <span>套利机会识别</span>
            </div>
          </div>

          <div className="demo-accounts">
            <h3>演示账户</h3>
            <div className="accounts-grid">
              <div className="account-item">
                <span className="account-role">交易者</span>
                <span className="account-credentials">trader / 123456</span>
              </div>
              <div className="account-item">
                <span className="account-role">流动性提供者</span>
                <span className="account-credentials">liquidity / 123456</span>
              </div>
              <div className="account-item">
                <span className="account-role">治理者</span>
                <span className="account-credentials">governor / 123456</span>
              </div>
              <div className="account-item">
                <span className="account-role">套利者</span>
                <span className="account-credentials">arbitrageur / 123456</span>
              </div>
              <div className="account-item">
                <span className="account-role">系统管理员</span>
                <span className="account-credentials">admin / 123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {NotificationComponent}
    </div>
  );
}

