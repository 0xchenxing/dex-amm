package models

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// DB represents a database connection
type DB struct {
	db *sql.DB
}

// NewDB creates a new database connection
func NewDB(dataSourceName string) (*DB, error) {
	db, err := sql.Open("mysql", dataSourceName)
	if err != nil {
		return nil, err
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return nil, err
	}

	// Create tables if they don't exist
	err = createTables(db)
	if err != nil {
		return nil, err
	}

	// Initialize with demo users
	err = initializeDemoData(db)
	if err != nil {
		return nil, err
	}

	return &DB{db: db}, nil
}

// createTables creates all necessary tables
func createTables(db *sql.DB) error {
	// Create users table
	usersTable := `
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
	`
	_, err := db.Exec(usersTable)
	if err != nil {
		return fmt.Errorf("error creating users table: %v", err)
	}

	// Create liquidity_pools table
	liquidityPoolsTable := `
	CREATE TABLE IF NOT EXISTS liquidity_pools (
		id VARCHAR(100) PRIMARY KEY,
		pair VARCHAR(100) NOT NULL,
		token1 VARCHAR(50) NOT NULL,
		token2 VARCHAR(50) NOT NULL,
		token1_address VARCHAR(255) NOT NULL,
		token2_address VARCHAR(255) NOT NULL,
		reserve1 DECIMAL(30, 10) NOT NULL,
		reserve2 DECIMAL(30, 10) NOT NULL,
		total_supply DECIMAL(30, 10) NOT NULL,
		status VARCHAR(20),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(liquidityPoolsTable)
	if err != nil {
		return fmt.Errorf("error creating liquidity_pools table: %v", err)
	}

	// Create governance_proposals table
	governanceProposalsTable := `
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
	`
	_, err = db.Exec(governanceProposalsTable)
	if err != nil {
		return fmt.Errorf("error creating governance_proposals table: %v", err)
	}

	// Create arbitrage_opportunities table
	arbitrageOpportunitiesTable := `
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
	`
	_, err = db.Exec(arbitrageOpportunitiesTable)
	if err != nil {
		return fmt.Errorf("error creating arbitrage_opportunities table: %v", err)
	}

	// Create system_logs table
	systemLogsTable := `
	CREATE TABLE IF NOT EXISTS system_logs (
		id VARCHAR(50) PRIMARY KEY,
		timestamp DATETIME NOT NULL,
		level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warning', 'error')),
		message TEXT NOT NULL,
		category VARCHAR(20) NOT NULL CHECK (category IN ('trade', 'liquidity', 'security', 'system')),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = db.Exec(systemLogsTable)
	if err != nil {
		return fmt.Errorf("error creating system_logs table: %v", err)
	}

	// Create liquidity_providers table
	liquidityProvidersTable := `
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
	`
	_, err = db.Exec(liquidityProvidersTable)
	if err != nil {
		return fmt.Errorf("error creating liquidity_providers table: %v", err)
	}

	// Create price_history table
	priceHistoryTable := `
	CREATE TABLE IF NOT EXISTS price_history (
		id INTEGER PRIMARY KEY AUTO_INCREMENT,
		pair_id VARCHAR(100) NOT NULL,
		price DECIMAL(30, 18) NOT NULL,
		timestamp DATETIME NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (pair_id) REFERENCES liquidity_pools(id) ON DELETE CASCADE
	);
	`
	_, err = db.Exec(priceHistoryTable)
	if err != nil {
		return fmt.Errorf("error creating price_history table: %v", err)
	}

	return nil
}

// initializeDemoData initializes the database with demo data
func initializeDemoData(db *sql.DB) error {
	// Check if users table is empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return fmt.Errorf("error checking users count: %v", err)
	}

	if count > 0 {
		return nil // Database already initialized
	}

	// Insert demo users
	userIDs := make(map[string]int)
	for _, user := range DemoUsers {
		result, err := db.Exec(
			"INSERT INTO users (username, password, role, email, created_at, status) VALUES (?, ?, ?, ?, ?, ?)",
			user.Username, user.Password, user.Role, user.Email, user.CreatedAt, user.Status,
		)
		if err != nil {
			return fmt.Errorf("error inserting demo user %s: %v", user.Username, err)
		}

		// Get the inserted user ID
		userID, err := result.LastInsertId()
		if err != nil {
			return fmt.Errorf("error getting user ID for %s: %v", user.Username, err)
		}
		userIDs[user.Username] = int(userID)
	}

	// Insert demo liquidity pools
	liquidityPools := []struct {
		id            string
		pair          string
		token1        string
		token2        string
		token1Address string
		token2Address string
		reserve1      float64
		reserve2      float64
		totalSupply   float64
	}{
		{"ETH-USDT", "ETH/USDT", "ETH", "USDT", "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", "0x7b7087A1B1a7950D163401F4D2D13898a9f99711", 500, 1225000, 25000},
		{"WBTC-USDT", "WBTC/USDT", "WBTC", "USDT", "0x8fC3B11b0dF4cD368850cf2d875A4164612A270f", "0x7b7087A1B1a7950D163401F4D2D13898a9f99711", 48.5, 2097500, 32000},
		{"DAI-USDT", "DAI/USDT", "DAI", "USDT", "0x83F20F44975D03b1b09e64809B757c47f942BEeA", "0x7b7087A1B1a7950D163401F4D2D13898a9f99711", 400000, 400000, 20000},
	}

	for _, pool := range liquidityPools {
		_, err := db.Exec(
			"INSERT INTO liquidity_pools (id, pair, token1, token2, token1_address, token2_address, reserve1, reserve2, total_supply, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			pool.id, pool.pair, pool.token1, pool.token2, pool.token1Address, pool.token2Address, pool.reserve1, pool.reserve2, pool.totalSupply, "active",
		)
		if err != nil {
			return fmt.Errorf("error inserting demo liquidity pool %s: %v", pool.id, err)
		}
	}

	// Insert demo governance proposals
	governanceProposals := []struct {
		id           string
		title        string
		description  string
		proposer     string
		status       string
		votesFor     float64
		votesAgainst float64
		totalVotes   float64
		startTime    time.Time
		endTime      time.Time
		quorum       float64
	}{
		{"proposal1", "调整交易手续费率", "将ETH-USDT交易对手续费从0.3%调整为0.25%", "governor", "active", 15000, 3000, 18000, time.Now().Add(-24 * time.Hour), time.Now().Add(6 * 24 * time.Hour), 10000},
		{"proposal2", "新增LINK-USDT交易对", "在平台上添加LINK-USDT交易对以增加交易选择", "governor", "pending", 8500, 1200, 9700, time.Now().Add(24 * time.Hour), time.Now().Add(7 * 24 * time.Hour), 10000},
	}

	for _, proposal := range governanceProposals {
		_, err := db.Exec(
			"INSERT INTO governance_proposals (id, title, description, proposer, status, votes_for, votes_against, total_votes, start_time, end_time, quorum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			proposal.id, proposal.title, proposal.description, proposal.proposer, proposal.status, proposal.votesFor, proposal.votesAgainst, proposal.totalVotes, proposal.startTime, proposal.endTime, proposal.quorum,
		)
		if err != nil {
			return fmt.Errorf("error inserting demo governance proposal %s: %v", proposal.id, err)
		}
	}

	// Insert demo arbitrage opportunities
	arbitrageOpportunities := []struct {
		id        string
		pair      string
		exchange1 string
		exchange2 string
		price1    float64
		price2    float64
		spread    float64
		profit    float64
		volume    float64
		timestamp time.Time
	}{
		{"arb1", "ETH-USDT", "DEX-AMM", "Uniswap", 2450.50, 2465.80, 0.62, 153.06, 10.0, time.Now()},
		{"arb2", "WBTC-USDT", "DEX-AMM", "SushiSwap", 43250.00, 43180.00, -0.16, -35.00, 0.5, time.Now()},
	}

	for _, arb := range arbitrageOpportunities {
		_, err := db.Exec(
			"INSERT INTO arbitrage_opportunities (id, pair, exchange1, exchange2, price1, price2, spread, profit, volume, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			arb.id, arb.pair, arb.exchange1, arb.exchange2, arb.price1, arb.price2, arb.spread, arb.profit, arb.volume, arb.timestamp,
		)
		if err != nil {
			return fmt.Errorf("error inserting demo arbitrage opportunity %s: %v", arb.id, err)
		}
	}

	// Insert demo system logs
	systemLogs := []struct {
		id        string
		timestamp time.Time
		level     string
		message   string
		category  string
	}{
		{"log1", time.Now(), "info", "用户 trader 执行交易：买入 2.5 ETH", "trade"},
		{"log2", time.Now().Add(-5 * time.Minute), "info", "流动性池 ETH-USDT 添加流动性 1000 USDT", "liquidity"},
		{"log3", time.Now().Add(-10 * time.Minute), "warning", "检测到异常交易模式，已触发风控机制", "security"},
	}

	for _, log := range systemLogs {
		_, err := db.Exec(
			"INSERT INTO system_logs (id, timestamp, level, message, category) VALUES (?, ?, ?, ?, ?)",
			log.id, log.timestamp, log.level, log.message, log.category,
		)
		if err != nil {
			return fmt.Errorf("error inserting demo system log %s: %v", log.id, err)
		}
	}

	return nil
}

// FindUserByUsernameAndPassword finds a user by username and password
func (db *DB) FindUserByUsernameAndPassword(username, password, role string) (*User, bool) {
	var user User

	err := db.db.QueryRow(
		"SELECT id, username, password, role, email, created_at, last_login, status FROM users WHERE username = ? AND password = ? AND role = ?",
		username, password, role,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Email, &user.CreatedAt, &user.LastLogin, &user.Status)

	if err != nil {
		return nil, false
	}

	return &user, true
}

// UpdateLastLogin updates the last login time for a user
func (db *DB) UpdateLastLogin(userID int) bool {
	_, err := db.db.Exec(
		"UPDATE users SET last_login = ? WHERE id = ?",
		time.Now(), userID,
	)
	return err == nil
}

// GetUserByID gets a user by ID
func (db *DB) GetUserByID(userID int) (*User, bool) {
	var user User

	err := db.db.QueryRow(
		"SELECT id, username, password, role, email, created_at, last_login, status FROM users WHERE id = ?",
		userID,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role, &user.Email, &user.CreatedAt, &user.LastLogin, &user.Status)

	if err != nil {
		return nil, false
	}

	return &user, true
}

// GetAllLiquidityPools gets all liquidity pools
func (db *DB) GetAllLiquidityPools() ([]LiquidityPool, error) {
	rows, err := db.db.Query(`
		SELECT id, pair, token1, token2, token1_address, token2_address, reserve1, reserve2, total_supply, status
		FROM liquidity_pools
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pools []LiquidityPool
	for rows.Next() {
		var pool LiquidityPool
		if err := rows.Scan(
			&pool.ID, &pool.Pair, &pool.Token1, &pool.Token2, &pool.Token1Address, &pool.Token2Address, &pool.Reserve1, &pool.Reserve2, &pool.TotalSupply, &pool.Status,
		); err != nil {
			continue
		}
		pools = append(pools, pool)
	}

	return pools, nil
}

// GetLiquidityPoolByID gets a liquidity pool by ID
func (db *DB) GetLiquidityPoolByID(id string) (*LiquidityPool, error) {
	var pool LiquidityPool
	err := db.db.QueryRow(`
		SELECT id, pair, token1, token2, token1_address, token2_address, reserve1, reserve2, total_supply, status
		FROM liquidity_pools
		WHERE id = ?
	`, id).Scan(
		&pool.ID, &pool.Pair, &pool.Token1, &pool.Token2, &pool.Token1Address, &pool.Token2Address, &pool.Reserve1, &pool.Reserve2, &pool.TotalSupply, &pool.Status,
	)
	if err != nil {
		return nil, err
	}

	return &pool, nil
}

// CreateLiquidityPool creates a new liquidity pool
func (db *DB) CreateLiquidityPool(pool LiquidityPool) error {
	_, err := db.db.Exec(`
		INSERT INTO liquidity_pools (id, pair, token1, token2, token1_address, token2_address, reserve1, reserve2, total_supply, status)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, pool.ID, pool.Pair, pool.Token1, pool.Token2, pool.Token1Address, pool.Token2Address, pool.Reserve1, pool.Reserve2, pool.TotalSupply, pool.Status)
	return err
}

// UpdateLiquidityPool updates a liquidity pool
func (db *DB) UpdateLiquidityPool(pool LiquidityPool) error {
	_, err := db.db.Exec(`
		UPDATE liquidity_pools
		SET pair = ?, token1 = ?, token2 = ?, token1_address = ?, token2_address = ?, reserve1 = ?, reserve2 = ?, total_supply = ?, status = ?
		WHERE id = ?
	`, pool.Pair, pool.Token1, pool.Token2, pool.Token1Address, pool.Token2Address, pool.Reserve1, pool.Reserve2, pool.TotalSupply, pool.Status, pool.ID)
	return err
}

// DeleteLiquidityPool deletes a liquidity pool
func (db *DB) DeleteLiquidityPool(id string) error {
	_, err := db.db.Exec("DELETE FROM liquidity_pools WHERE id = ?", id)
	return err
}

// GetAllSystemLogs gets all system logs
func (db *DB) GetAllSystemLogs() ([]SystemLog, error) {
	rows, err := db.db.Query(`
		SELECT id, timestamp, level, message, category
		FROM system_logs
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []SystemLog
	for rows.Next() {
		var log SystemLog
		if err := rows.Scan(
			&log.ID, &log.Timestamp, &log.Level, &log.Message, &log.Category,
		); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	return logs, nil
}

// GetSystemLogsByCategory gets system logs by category
func (db *DB) GetSystemLogsByCategory(category string) ([]SystemLog, error) {
	rows, err := db.db.Query(`
		SELECT id, timestamp, level, message, category
		FROM system_logs
		WHERE category = ?
	`, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []SystemLog
	for rows.Next() {
		var log SystemLog
		if err := rows.Scan(
			&log.ID, &log.Timestamp, &log.Level, &log.Message, &log.Category,
		); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	return logs, nil
}

// CreateSystemLog creates a new system log
func (db *DB) CreateSystemLog(log SystemLog) error {
	_, err := db.db.Exec(`
		INSERT INTO system_logs (id, timestamp, level, message, category)
		VALUES (?, ?, ?, ?, ?)
	`, log.ID, log.Timestamp, log.Level, log.Message, log.Category)
	return err
}

// GetAllUsers gets all users
func (db *DB) GetAllUsers() ([]User, error) {
	rows, err := db.db.Query(`
		SELECT id, username, password, role, email, created_at, last_login, status
		FROM users
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		var lastLogin sql.NullTime
		if err := rows.Scan(
			&user.ID, &user.Username, &user.Password, &user.Role, &user.Email, &user.CreatedAt, &lastLogin, &user.Status,
		); err != nil {
			continue
		}
		if lastLogin.Valid {
			user.LastLogin = &lastLogin.Time
		}
		users = append(users, user)
	}

	return users, nil
}

// UpdateUserStatus updates a user's status
func (db *DB) UpdateUserStatus(userID int, status string) error {
	_, err := db.db.Exec(
		"UPDATE users SET status = ? WHERE id = ?",
		status, userID,
	)
	return err
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.db.Close()
}

// Global database instance
var globalDB *DB

// InitDB initializes the global database instance
func InitDB(dataSourceName string) error {
	var err error
	globalDB, err = NewDB(dataSourceName)
	return err
}

// GetDB returns the global database instance
func GetDB() *DB {
	return globalDB
}
