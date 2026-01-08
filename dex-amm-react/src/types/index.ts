// 用户角色类型
export type UserRole = 'trader' | 'liquidity' | 'governor' | 'arbitrageur' | 'admin';

// 用户数据
export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  balance: Record<string, number>;
  createdAt: string;
  lastLogin: string;
  status?: 'active' | 'inactive';
}

// 交易对数据
export interface TradingPair {
  id: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  volume24h: number;
  change24h: number;
  liquidity: number;
  fee: number;
}

// 交易记录
export interface Trade {
  id: string;
  user: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  fee: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// 流动性池数据
export interface LiquidityPool {
  id: string;
  pair: string;
  token1: string;
  token2: string;
  totalLiquidity: number;
  volume24h: number;
  apy: number;
  reserve1: number;
  reserve2: number;
  totalSupply: number;
  status: 'active' | 'inactive';
}

// 治理提案
export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'pending' | 'passed' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  startTime: string;
  endTime: string;
  quorum: number;
}

// 套利机会
export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  exchange1: string;
  exchange2: string;
  price1: number;
  price2: number;
  spread: number;
  profit: number;
  volume: number;
  timestamp: string;
}

// 系统日志
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  category: 'trade' | 'liquidity' | 'security' | 'system';
}

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';
