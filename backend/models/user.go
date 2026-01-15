package models

import (
	"time"
)

// User represents a user in the system
type User struct {
	ID        int                `json:"id"`
	Username  string             `json:"username"`
	Password  string             `json:"password"`
	Role      string             `json:"role"`
	CreatedAt time.Time          `json:"created_at"`
	LastLogin time.Time          `json:"last_login,omitempty"`
	Email     string             `json:"email,omitempty"`
	Balance   map[string]float64 `json:"balance,omitempty"`
	Status    string             `json:"status,omitempty"`
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

// DemoUsers defines the demo users for the system
var DemoUsers = []User{
	{
		ID:       1,
		Username: "trader",
		Password: "123456",
		Role:     "trader",
		Email:    "trader@dex.com",
		Balance: map[string]float64{
			"ETH":  10.5,
			"USDT": 5000,
			"DAI":  2000,
		},
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		ID:       2,
		Username: "liquidity",
		Password: "123456",
		Role:     "liquidity",
		Email:    "liquidity@dex.com",
		Balance: map[string]float64{
			"ETH":  50.0,
			"USDT": 25000,
			"DAI":  15000,
		},
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		ID:       3,
		Username: "governor",
		Password: "123456",
		Role:     "governor",
		Email:    "governor@dex.com",
		Balance: map[string]float64{
			"ETH":  100.0,
			"USDT": 50000,
		},
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		ID:       4,
		Username: "arbitrageur",
		Password: "123456",
		Role:     "arbitrageur",
		Email:    "arbitrageur@dex.com",
		Balance: map[string]float64{
			"ETH":  25.0,
			"USDT": 15000,
			"DAI":  8000,
		},
		CreatedAt: time.Now(),
		Status:    "active",
	},
	{
		ID:       5,
		Username: "admin",
		Password: "123456",
		Role:     "admin",
		Email:    "admin@dex.com",
		Balance: map[string]float64{
			"ETH":  1000.0,
			"USDT": 100000,
		},
		CreatedAt: time.Now(),
		Status:    "active",
	},
}
