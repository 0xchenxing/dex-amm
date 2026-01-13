import type { 
  User, 
  TradingPair, 
  LiquidityPool, 
  Trade, 
  GovernanceProposal, 
  ArbitrageOpportunity,
  SystemLog 
} from '../types';

// 存储键名常量
const STORAGE_KEYS = {
  USERS: 'dexUsers',
  TRADING_PAIRS: 'tradingPairs',
  LIQUIDITY_POOLS: 'liquidityPools',
  TRADES: 'trades',
  GOVERNANCE_PROPOSALS: 'governanceProposals',
  SYSTEM_LOGS: 'systemLogs',
  CURRENT_USER: 'currentUser',
  ARBITRAGE_OPPORTUNITIES: 'arbitrageOpportunities',
} as const;

// 初始化演示数据
export function initializeDemoData() {
  if (localStorage.getItem(STORAGE_KEYS.USERS)) {
    return;
  }

  const users: User[] = [
    {
      id: 'user1',
      username: 'trader',
      password: '123456',
      role: 'trader',
      email: 'trader1@dex.com',
      balance: {
        ETH: 10.5,
        USDT: 5000,
        DAI: 2000,
        WBTC: 0.5
      },
      createdAt: '2024-01-15',
      lastLogin: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'user2',
      username: 'liquidity',
      password: '123456',
      role: 'liquidity',
      email: 'liquidity1@dex.com',
      balance: {
        ETH: 50.0,
        USDT: 25000,
        DAI: 15000,
        WBTC: 2.0
      },
      createdAt: '2024-01-10',
      lastLogin: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'user3',
      username: 'governor',
      password: '123456',
      role: 'governor',
      email: 'governor1@dex.com',
      balance: {
        ETH: 100.0,
        USDT: 50000,
        DEX: 10000
      },
      createdAt: '2024-01-05',
      lastLogin: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'user4',
      username: 'arbitrageur',
      password: '123456',
      role: 'arbitrageur',
      email: 'arbitrageur1@dex.com',
      balance: {
        ETH: 25.0,
        USDT: 15000,
        DAI: 8000,
        WBTC: 1.0
      },
      createdAt: '2024-01-12',
      lastLogin: new Date().toISOString(),
      status: 'active'
    },
    {
      id: 'admin1',
      username: 'admin',
      password: '123456',
      role: 'admin',
      email: 'admin@dex.com',
      balance: {
        ETH: 1000.0,
        USDT: 100000,
        DEX: 50000
      },
      createdAt: '2024-01-01',
      lastLogin: new Date().toISOString(),
      status: 'active'
    }
  ];

  const tradingPairs: TradingPair[] = [
    {
      id: 'ETH-USDT',
      baseToken: 'ETH',
      quoteToken: 'USDT',
      price: 2450.50,
      volume24h: 1250000,
      change24h: 2.5,
      liquidity: 5000000,
      fee: 0.003
    },
    {
      id: 'WBTC-USDT',
      baseToken: 'WBTC',
      quoteToken: 'USDT',
      price: 43250.00,
      volume24h: 850000,
      change24h: -1.2,
      liquidity: 3200000,
      fee: 0.003
    },
    {
      id: 'DAI-USDT',
      baseToken: 'DAI',
      quoteToken: 'USDT',
      price: 1.001,
      volume24h: 450000,
      change24h: 0.1,
      liquidity: 2800000,
      fee: 0.001
    }
  ];

  const liquidityPools: LiquidityPool[] = [
    {
      id: 'ETH-USDT',
      pair: 'ETH/USDT',
      token1: 'ETH',
      token2: 'USDT',
      totalLiquidity: 1250000,
      volume24h: 850000,
      apy: 15.2,
      reserve1: 500,
      reserve2: 1225000,
      totalSupply: 25000,
      status: 'active'
    },
    {
      id: 'WBTC-USDT',
      pair: 'WBTC/USDT',
      token1: 'WBTC',
      token2: 'USDT',
      totalLiquidity: 2100000,
      volume24h: 1200000,
      apy: 18.5,
      reserve1: 48.5,
      reserve2: 2097500,
      totalSupply: 32000,
      status: 'active'
    },
    {
      id: 'DAI-USDT',
      pair: 'DAI/USDT',
      token1: 'DAI',
      token2: 'USDT',
      totalLiquidity: 800000,
      volume24h: 320000,
      apy: 8.3,
      reserve1: 400000,
      reserve2: 400000,
      totalSupply: 20000,
      status: 'active'
    }
  ];

  const trades: Trade[] = [
    {
      id: 'trade1',
      user: 'trader',
      pair: 'ETH-USDT',
      type: 'buy',
      amount: 2.5,
      price: 2445.30,
      total: 6113.25,
      fee: 18.34,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed'
    },
    {
      id: 'trade2',
      user: 'trader',
      pair: 'WBTC-USDT',
      type: 'sell',
      amount: 0.1,
      price: 43180.00,
      total: 4318.00,
      fee: 12.95,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'completed'
    }
  ];

  const governanceProposals: GovernanceProposal[] = [
    {
      id: 'proposal1',
      title: '调整交易手续费率',
      description: '将ETH-USDT交易对手续费从0.3%调整为0.25%',
      proposer: 'governor',
      status: 'active',
      votesFor: 15000,
      votesAgainst: 3000,
      totalVotes: 18000,
      startTime: new Date(Date.now() - 86400000).toISOString(),
      endTime: new Date(Date.now() + 518400000).toISOString(),
      quorum: 10000
    },
    {
      id: 'proposal2',
      title: '新增LINK-USDT交易对',
      description: '在平台上添加LINK-USDT交易对以增加交易选择',
      proposer: 'governor',
      status: 'pending',
      votesFor: 8500,
      votesAgainst: 1200,
      totalVotes: 9700,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 604800000).toISOString(),
      quorum: 10000
    }
  ];

  const arbitrageOpportunities: ArbitrageOpportunity[] = [
    {
      id: 'arb1',
      pair: 'ETH-USDT',
      exchange1: 'DEX-AMM',
      exchange2: 'Uniswap',
      price1: 2450.50,
      price2: 2465.80,
      spread: 0.62,
      profit: 153.06,
      volume: 10.0,
      timestamp: new Date().toISOString()
    },
    {
      id: 'arb2',
      pair: 'WBTC-USDT',
      exchange1: 'DEX-AMM',
      exchange2: 'SushiSwap',
      price1: 43250.00,
      price2: 43180.00,
      spread: -0.16,
      profit: -35.00,
      volume: 0.5,
      timestamp: new Date().toISOString()
    }
  ];

  const systemLogs: SystemLog[] = [
    {
      id: 'log1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: '用户 trader 执行交易：买入 2.5 ETH',
      category: 'trade'
    },
    {
      id: 'log2',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'info',
      message: '流动性池 ETH-USDT 添加流动性 1000 USDT',
      category: 'liquidity'
    },
    {
      id: 'log3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'warning',
      message: '检测到异常交易模式，已触发风控机制',
      category: 'security'
    }
  ];

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.TRADING_PAIRS, JSON.stringify(tradingPairs));
  localStorage.setItem(STORAGE_KEYS.LIQUIDITY_POOLS, JSON.stringify(liquidityPools));
  localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  localStorage.setItem(STORAGE_KEYS.GOVERNANCE_PROPOSALS, JSON.stringify(governanceProposals));
  localStorage.setItem(STORAGE_KEYS.ARBITRAGE_OPPORTUNITIES, JSON.stringify(arbitrageOpportunities));
  localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(systemLogs));
}

// 用户相关操作
export const userStorage = {
  getAll: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) as User[] : [];
  },
  getCurrent: (): User | null => {
    const data = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) as User : null;
  },
  setCurrent: (user: User): void => {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },
  clearCurrent: (): void => {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
  update: (user: User): void => {
    const users = userStorage.getAll();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  }
};

// 交易对相关操作
export const tradingPairStorage = {
  getAll: (): TradingPair[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRADING_PAIRS);
    return data ? JSON.parse(data) : [];
  },
  getById: (id: string): TradingPair | undefined => {
    return tradingPairStorage.getAll().find(pair => pair.id === id);
  }
};

// 流动性池相关操作
export const liquidityPoolStorage = {
  getAll: (): LiquidityPool[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LIQUIDITY_POOLS);
    return data ? JSON.parse(data) : [];
  },
  getById: (id: string): LiquidityPool | undefined => {
    return liquidityPoolStorage.getAll().find(pool => pool.id === id);
  }
};

// 交易相关操作
export const tradeStorage = {
  getAll: (): Trade[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TRADES);
    return data ? JSON.parse(data) : [];
  },
  getByUser: (username: string): Trade[] => {
    return tradeStorage.getAll().filter(trade => trade.user === username);
  },
  getById: (id: string): Trade | undefined => {
    return tradeStorage.getAll().find(trade => trade.id === id);
  },
  add: (trade: Trade): void => {
    const trades = tradeStorage.getAll();
    trades.push(trade);
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  },
  update: (trade: Trade): void => {
    const trades = tradeStorage.getAll();
    const index = trades.findIndex(t => t.id === trade.id);
    if (index !== -1) {
      trades[index] = trade;
      localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
    }
  }
};

// 治理提案相关操作
export const governanceStorage = {
  getAll: (): GovernanceProposal[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GOVERNANCE_PROPOSALS);
    return data ? JSON.parse(data) : [];
  },
  getById: (id: string): GovernanceProposal | undefined => {
    return governanceStorage.getAll().find(proposal => proposal.id === id);
  },
  save: (proposal: GovernanceProposal): void => {
    const proposals = governanceStorage.getAll();
    const index = proposals.findIndex(p => p.id === proposal.id);
    if (index !== -1) {
      proposals[index] = proposal;
    } else {
      proposals.push(proposal);
    }
    localStorage.setItem(STORAGE_KEYS.GOVERNANCE_PROPOSALS, JSON.stringify(proposals));
  }
};

// 套利机会相关操作
export const arbitrageStorage = {
  getAll: (): ArbitrageOpportunity[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ARBITRAGE_OPPORTUNITIES);
    return data ? JSON.parse(data) : [];
  }
};

// 系统日志相关操作
export const systemLogStorage = {
  getAll: (): SystemLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_LOGS);
    return data ? JSON.parse(data) : [];
  },
  add: (log: SystemLog): void => {
    const logs = systemLogStorage.getAll();
    logs.unshift(log);
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    localStorage.setItem(STORAGE_KEYS.SYSTEM_LOGS, JSON.stringify(logs));
  }
};

