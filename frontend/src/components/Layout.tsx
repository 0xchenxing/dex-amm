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
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L2 8L16 14L30 8L16 2Z" fill="url(#gradient1)" />
              <path d="M2 8L16 14L30 8L16 20L2 14L2 8Z" fill="url(#gradient2)" />
              <path d="M16 20L30 14L30 24L16 30L2 24L2 14L16 20Z" fill="url(#gradient3)" />
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
          <div className="logo-text">
            <div className="logo-title">DEX-AMM</div>
            <div className="logo-subtitle">去中心化交易所</div>
          </div>
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
          <div className="user-avatar">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{getRoleName(user?.role || '')}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 16H2V2H7M12 13L16 9L12 5M16 9H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="wallet-container">
            <ConnectButton />
          </div>
        </div>
        <div className="content-wrapper">
          {children}
        </div>
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

