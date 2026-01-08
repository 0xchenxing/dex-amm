import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  navItems?: Array<{ path: string; label: string; icon: string }>;
}

export function Layout({ children, navItems }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">
          <div className="logo-icon">DEX</div>
          <div className="logo-text">DEX-AMM</div>
        </div>

        {navItems && navItems.length > 0 && (
          <nav className="nav-menu">
            {navItems.map((item, index) => (
              <div
                key={index}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => item.path && navigate(item.path)}
              >
                <div className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              </div>
            ))}
          </nav>
        )}

        <div className="user-info">
          <div className="user-name">{user?.username}</div>
          <div className="user-role">{getRoleName(user?.role || '')}</div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="wallet-container">
          <ConnectButton />
        </div>
        {children}
      </div>
    </div>
  );
}

function getRoleName(role: string): string {
  const roleMap: Record<string, string> = {
    trader: '交易者',
    liquidity: '流动性提供者',
    governor: '治理者',
    arbitrageur: '套利者',
    admin: '系统管理员'
  };
  return roleMap[role] || role;
}

