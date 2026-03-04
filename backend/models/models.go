package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID        int        `json:"id"`
	Username  string     `json:"username"`
	Password  string     `json:"password"`
	Role      string     `json:"role"`
	CreatedAt time.Time  `json:"createdAt"`
	LastLogin *time.Time `json:"lastLogin,omitempty"`
	Email     string     `json:"email,omitempty"`
	Status    string     `json:"status,omitempty"`
}

// UserLoginRequest represents the login request body
type UserLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=trader liquidity governor arbitrageur admin"`
}

// UserLoginResponse represents the login response body
type UserLoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// ValidRoles defines the valid roles in the system
var ValidRoles = []string{"trader", "liquidity", "governor", "arbitrageur", "admin"}

// DemoUsers represents the demo users for initialization
var DemoUsers = []User{
	{
		Username:  "trader",
		Password:  "123456",
		Role:      "trader",
		Email:     "trader@dex.com",
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		Username:  "liquidity",
		Password:  "123456",
		Role:      "liquidity",
		Email:     "liquidity@dex.com",
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		Username:  "governor",
		Password:  "123456",
		Role:      "governor",
		Email:     "governor@dex.com",
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		Username:  "arbitrageur",
		Password:  "123456",
		Role:      "arbitrageur",
		Email:     "arbitrageur@dex.com",
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		Username:  "admin",
		Password:  "123456",
		Role:      "admin",
		Email:     "admin@dex.com",
		CreatedAt: time.Now(),
		Status:    "active",
	},
}

// LiquidityPool represents a liquidity pool

type LiquidityPool struct {
	ID             string  `json:"id"`
	Pair           string  `json:"pair"`
	Token1         string  `json:"token1"`
	Token2         string  `json:"token2"`
	Token1Address  string  `json:"token1Address"`
	Token2Address  string  `json:"token2Address"`
	Reserve1       float64 `json:"reserve1"`
	Reserve2       float64 `json:"reserve2"`
	TotalSupply    float64 `json:"totalSupply"`
	Status         string  `json:"status"`
}

// Trade represents a trade

type Trade struct {
	ID           string    `json:"id"`
	UserID       int       `json:"userId"`
	UserUsername string    `json:"userUsername"`
	Pair         string    `json:"pair"`
	Type         string    `json:"type"`
	Amount       float64   `json:"amount"`
	Price        float64   `json:"price"`
	Total        float64   `json:"total"`
	Fee          float64   `json:"fee"`
	Timestamp    time.Time `json:"timestamp"`
	Status       string    `json:"status"`
}

// SystemLog represents a system log

type SystemLog struct {
	ID        string    `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	Category  string    `json:"category"`
}

// GovernanceProposal represents a governance proposal

type GovernanceProposal struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Proposer     string    `json:"proposer"`
	Status       string    `json:"status"`
	VotesFor     float64   `json:"votesFor"`
	VotesAgainst float64   `json:"votesAgainst"`
	TotalVotes   float64   `json:"totalVotes"`
	StartTime    time.Time `json:"startTime"`
	EndTime      time.Time `json:"endTime"`
	Quorum       float64   `json:"quorum"`
}

// ArbitrageOpportunity represents an arbitrage opportunity

type ArbitrageOpportunity struct {
	ID        string    `json:"id"`
	Pair      string    `json:"pair"`
	Exchange1 string    `json:"exchange1"`
	Exchange2 string    `json:"exchange2"`
	Price1    float64   `json:"price1"`
	Price2    float64   `json:"price2"`
	Spread    float64   `json:"spread"`
	Profit    float64   `json:"profit"`
	Volume    float64   `json:"volume"`
	Timestamp time.Time `json:"timestamp"`
}
