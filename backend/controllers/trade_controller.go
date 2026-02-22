package controllers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// TradeController handles trade requests
type TradeController struct {
	config *config.Config
	db     *models.DB
}

// NewTradeController creates a new trade controller
func NewTradeController(cfg *config.Config, db *models.DB) *TradeController {
	return &TradeController{
		config: cfg,
		db:     db,
	}
}

// GetAllTrades gets all trades
func (tc *TradeController) GetAllTrades(c *gin.Context) {
	trades, err := tc.db.GetAllTrades()
	if err != nil {
		log.Printf("Error getting trades: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trades"})
		return
	}

	c.JSON(http.StatusOK, trades)
}

// GetTradesByUser gets trades by user
func (tc *TradeController) GetTradesByUser(c *gin.Context) {
	userIDStr := c.Param("userId")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	trades, err := tc.db.GetTradesByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trades by user"})
		return
	}

	c.JSON(http.StatusOK, trades)
}

// GetTradeByID gets a trade by ID
func (tc *TradeController) GetTradeByID(c *gin.Context) {
	id := c.Param("id")
	trade, err := tc.db.GetTradeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trade not found"})
		return
	}

	c.JSON(http.StatusOK, trade)
}

// CreateTrade creates a new trade
func (tc *TradeController) CreateTrade(c *gin.Context) {
	var trade models.Trade
	if err := c.ShouldBindJSON(&trade); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trade data"})
		return
	}

	if err := tc.db.CreateTrade(trade); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create trade"})
		return
	}

	c.JSON(http.StatusCreated, trade)
}

// DeleteTrade deletes a trade
func (tc *TradeController) DeleteTrade(c *gin.Context) {
	// Implementation to delete trade
	c.JSON(http.StatusOK, gin.H{"message": "Delete trade"})
}
