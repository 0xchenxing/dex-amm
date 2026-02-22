package controllers

import (
	"net/http"

	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// TradingPairController handles trading pair requests
type TradingPairController struct {
	config *config.Config
	db     *models.DB
}

// NewTradingPairController creates a new trading pair controller
func NewTradingPairController(cfg *config.Config, db *models.DB) *TradingPairController {
	return &TradingPairController{
		config: cfg,
		db:     db,
	}
}

// GetAllTradingPairs gets all trading pairs
func (tpc *TradingPairController) GetAllTradingPairs(c *gin.Context) {
	pairs, err := tpc.db.GetAllTradingPairs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trading pairs"})
		return
	}

	c.JSON(http.StatusOK, pairs)
}

// GetTradingPairByID gets a trading pair by ID
func (tpc *TradingPairController) GetTradingPairByID(c *gin.Context) {
	id := c.Param("id")
	pair, err := tpc.db.GetTradingPairByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Trading pair not found"})
		return
	}

	c.JSON(http.StatusOK, pair)
}

// CreateTradingPair creates a new trading pair
func (tpc *TradingPairController) CreateTradingPair(c *gin.Context) {
	var pair models.TradingPair
	if err := c.ShouldBindJSON(&pair); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trading pair data"})
		return
	}

	if err := tpc.db.CreateTradingPair(pair); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create trading pair"})
		return
	}

	c.JSON(http.StatusCreated, pair)
}

// UpdateTradingPair updates a trading pair
func (tpc *TradingPairController) UpdateTradingPair(c *gin.Context) {
	id := c.Param("id")
	var pair models.TradingPair
	if err := c.ShouldBindJSON(&pair); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid trading pair data"})
		return
	}

	pair.ID = id
	if err := tpc.db.UpdateTradingPair(pair); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update trading pair"})
		return
	}

	c.JSON(http.StatusOK, pair)
}

// DeleteTradingPair deletes a trading pair
func (tpc *TradingPairController) DeleteTradingPair(c *gin.Context) {
	id := c.Param("id")
	if err := tpc.db.DeleteTradingPair(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete trading pair"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Trading pair deleted successfully"})
}
