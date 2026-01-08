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

    const success = await login(username, password, role);

    if (success) {
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
      showNotification('用户名、密码或角色不匹配', 'error');
    }
  };

  return (
    <div className="login-container">
      <div className="logo">DEX</div>
      <h1>DEX-AMM 系统</h1>
      <p className="subtitle">去中心化交易所自动做市商平台</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

        <button type="submit" className="login-btn">
          登录系统
        </button>
      </form>

      <div className="features">
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <span>自动做市商（AMM）机制</span>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <span>流动性挖矿与收益农场</span>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <span>去中心化治理投票</span>
        </div>
        <div className="feature-item">
          <div className="feature-icon">✓</div>
          <span>套利机会识别</span>
        </div>
      </div>

      <div className="demo-accounts">
        <h3>演示账户</h3>
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

      {NotificationComponent}
    </div>
  );
}

