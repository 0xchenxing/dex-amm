-- DEX-AMM 数据库表结构 (MySQL兼容版本)

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('trader', 'liquidity', 'governor', 'arbitrageur', 'admin')),
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at DATETIME NOT NULL,
    last_login DATETIME,
    status VARCHAR(10) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 用户余额表
CREATE TABLE IF NOT EXISTS user_balances (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(20) NOT NULL,
    balance DECIMAL(30, 18) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, token)
);

-- 3. 交易对表
CREATE TABLE IF NOT EXISTS trading_pairs (
    id VARCHAR(50) PRIMARY KEY,
    base_token VARCHAR(20) NOT NULL,
    quote_token VARCHAR(20) NOT NULL,
    price DECIMAL(30, 18) NOT NULL,
    volume24h DECIMAL(30, 2) NOT NULL,
    change24h DECIMAL(10, 2) NOT NULL,
    liquidity DECIMAL(30, 2) NOT NULL,
    fee DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. 流动性池表
CREATE TABLE IF NOT EXISTS liquidity_pools (
    id VARCHAR(50) PRIMARY KEY,
    pair VARCHAR(50) NOT NULL,
    token1 VARCHAR(20) NOT NULL,
    token2 VARCHAR(20) NOT NULL,
    total_liquidity DECIMAL(30, 2) NOT NULL,
    volume24h DECIMAL(30, 2) NOT NULL,
    apy DECIMAL(10, 2) NOT NULL,
    reserve1 DECIMAL(30, 18) NOT NULL,
    reserve2 DECIMAL(30, 18) NOT NULL,
    total_supply DECIMAL(30, 18) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. 交易记录表
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(50) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    user_username VARCHAR(50) NOT NULL,
    pair VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    amount DECIMAL(30, 18) NOT NULL,
    price DECIMAL(30, 18) NOT NULL,
    total DECIMAL(30, 18) NOT NULL,
    fee DECIMAL(30, 18) NOT NULL,
    timestamp DATETIME NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. 治理提案表
CREATE TABLE IF NOT EXISTS governance_proposals (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    proposer VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'pending', 'passed', 'rejected')),
    votes_for DECIMAL(30, 2) NOT NULL DEFAULT 0,
    votes_against DECIMAL(30, 2) NOT NULL DEFAULT 0,
    total_votes DECIMAL(30, 2) NOT NULL DEFAULT 0,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    quorum DECIMAL(30, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. 套利机会表
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
    id VARCHAR(50) PRIMARY KEY,
    pair VARCHAR(50) NOT NULL,
    exchange1 VARCHAR(50) NOT NULL,
    exchange2 VARCHAR(50) NOT NULL,
    price1 DECIMAL(30, 18) NOT NULL,
    price2 DECIMAL(30, 18) NOT NULL,
    spread DECIMAL(10, 6) NOT NULL,
    profit DECIMAL(30, 2) NOT NULL,
    volume DECIMAL(30, 18) NOT NULL,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warning', 'error')),
    message TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('trade', 'liquidity', 'security', 'system')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. 流动性提供者表
CREATE TABLE IF NOT EXISTS liquidity_providers (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    pool_id VARCHAR(50) NOT NULL,
    liquidity_amount DECIMAL(30, 18) NOT NULL,
    token1_amount DECIMAL(30, 18) NOT NULL,
    token2_amount DECIMAL(30, 18) NOT NULL,
    share_percentage DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES liquidity_pools(id) ON DELETE CASCADE
);

-- 10. 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    pair_id VARCHAR(50) NOT NULL,
    price DECIMAL(30, 18) NOT NULL,
    timestamp DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pair_id) REFERENCES trading_pairs(id) ON DELETE CASCADE
);

-- 插入示例数据

-- 插入用户数据
INSERT INTO users (id, username, password, role, email, created_at, last_login, status) VALUES
(1, 'trader', '123456', 'trader', 'trader@dex.com', '2024-01-15', NOW(), 'active'),
(2, 'liquidity', '123456', 'liquidity', 'liquidity@dex.com', '2024-01-10', NOW(), 'active'),
(3, 'governor', '123456', 'governor', 'governor@dex.com', '2024-01-05', NOW(), 'active'),
(4, 'arbitrageur', '123456', 'arbitrageur', 'arbitrageur@dex.com', '2024-01-12', NOW(), 'active'),
(5, 'admin', '123456', 'admin', 'admin@dex.com', '2024-01-01', NOW(), 'active');

-- 插入用户余额数据
INSERT INTO user_balances (user_id, token, balance) VALUES
(1, 'ETH', 10.5),
(1, 'USDT', 5000),
(1, 'DAI', 2000),
(1, 'WBTC', 0.5),
(2, 'ETH', 50.0),
(2, 'USDT', 25000),
(2, 'DAI', 15000),
(2, 'WBTC', 2.0),
(3, 'ETH', 100.0),
(3, 'USDT', 50000),
(3, 'DEX', 10000),
(4, 'ETH', 25.0),
(4, 'USDT', 15000),
(4, 'DAI', 8000),
(4, 'WBTC', 1.0),
(5, 'ETH', 1000.0),
(5, 'USDT', 100000),
(5, 'DEX', 50000);

-- 插入交易对数据
INSERT INTO trading_pairs (id, base_token, quote_token, price, volume24h, change24h, liquidity, fee) VALUES
('ETH-USDT', 'ETH', 'USDT', 2450.50, 1250000, 2.5, 5000000, 0.003),
('WBTC-USDT', 'WBTC', 'USDT', 43250.00, 850000, -1.2, 3200000, 0.003),
('DAI-USDT', 'DAI', 'USDT', 1.001, 450000, 0.1, 2800000, 0.001);

-- 插入流动性池数据
INSERT INTO liquidity_pools (id, pair, token1, token2, total_liquidity, volume24h, apy, reserve1, reserve2, total_supply, status) VALUES
('ETH-USDT', 'ETH/USDT', 'ETH', 'USDT', 1250000, 850000, 15.2, 500, 1225000, 25000, 'active'),
('WBTC-USDT', 'WBTC/USDT', 'WBTC', 'USDT', 2100000, 1200000, 18.5, 48.5, 2097500, 32000, 'active'),
('DAI-USDT', 'DAI/USDT', 'DAI', 'USDT', 800000, 320000, 8.3, 400000, 400000, 20000, 'active');

-- 插入交易记录数据
INSERT INTO trades (id, user_id, user_username, pair, type, amount, price, total, fee, timestamp, status) VALUES
('trade1', 1, 'trader', 'ETH-USDT', 'buy', 2.5, 2445.30, 6113.25, 18.34, NOW() - INTERVAL 1 HOUR, 'completed'),
('trade2', 1, 'trader', 'WBTC-USDT', 'sell', 0.1, 43180.00, 4318.00, 12.95, NOW() - INTERVAL 2 HOUR, 'completed');

-- 插入治理提案数据
INSERT INTO governance_proposals (id, title, description, proposer, status, votes_for, votes_against, total_votes, start_time, end_time, quorum) VALUES
('proposal1', '调整交易手续费率', '将ETH-USDT交易对手续费从0.3%调整为0.25%', 'governor', 'active', 15000, 3000, 18000, NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 6 DAY, 10000),
('proposal2', '新增LINK-USDT交易对', '在平台上添加LINK-USDT交易对以增加交易选择', 'governor', 'pending', 8500, 1200, 9700, NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 7 DAY, 10000);

-- 插入套利机会数据
INSERT INTO arbitrage_opportunities (id, pair, exchange1, exchange2, price1, price2, spread, profit, volume, timestamp) VALUES
('arb1', 'ETH-USDT', 'DEX-AMM', 'Uniswap', 2450.50, 2465.80, 0.62, 153.06, 10.0, NOW()),
('arb2', 'WBTC-USDT', 'DEX-AMM', 'SushiSwap', 43250.00, 43180.00, -0.16, -35.00, 0.5, NOW());

-- 插入系统日志数据
INSERT INTO system_logs (id, timestamp, level, message, category) VALUES
('log1', NOW(), 'info', '用户 trader 执行交易：买入 2.5 ETH', 'trade'),
('log2', NOW() - INTERVAL 5 MINUTE, 'info', '流动性池 ETH-USDT 添加流动性 1000 USDT', 'liquidity'),
('log3', NOW() - INTERVAL 10 MINUTE, 'warning', '检测到异常交易模式，已触发风控机制', 'security');

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_base_quote ON trading_pairs(base_token, quote_token);
CREATE INDEX IF NOT EXISTS idx_liquidity_pools_status ON liquidity_pools(status);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(pair);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON system_logs(timestamp);
