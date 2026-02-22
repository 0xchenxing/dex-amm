package controllers

import (
	"net/http"

	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// LiquidityPoolController handles liquidity pool requests
type LiquidityPoolController struct {
	config *config.Config
	db     *models.DB
}

// NewLiquidityPoolController creates a new liquidity pool controller
func NewLiquidityPoolController(cfg *config.Config, db *models.DB) *LiquidityPoolController {
	return &LiquidityPoolController{
		config: cfg,
		db:     db,
	}
}

// GetAllLiquidityPools gets all liquidity pools
func (lpc *LiquidityPoolController) GetAllLiquidityPools(c *gin.Context) {
	pools, err := lpc.db.GetAllLiquidityPools()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get liquidity pools"})
		return
	}

	c.JSON(http.StatusOK, pools)
}

// GetLiquidityPoolByID gets a liquidity pool by ID
func (lpc *LiquidityPoolController) GetLiquidityPoolByID(c *gin.Context) {
	id := c.Param("id")
	pool, err := lpc.db.GetLiquidityPoolByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Liquidity pool not found"})
		return
	}

	c.JSON(http.StatusOK, pool)
}

// CreateLiquidityPool creates a new liquidity pool
func (lpc *LiquidityPoolController) CreateLiquidityPool(c *gin.Context) {
	var pool models.LiquidityPool
	if err := c.ShouldBindJSON(&pool); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pool data"})
		return
	}

	if err := lpc.db.CreateLiquidityPool(pool); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create liquidity pool"})
		return
	}

	c.JSON(http.StatusCreated, pool)
}

// UpdateLiquidityPool updates a liquidity pool
func (lpc *LiquidityPoolController) UpdateLiquidityPool(c *gin.Context) {
	id := c.Param("id")
	var pool models.LiquidityPool
	if err := c.ShouldBindJSON(&pool); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid pool data"})
		return
	}

	pool.ID = id
	if err := lpc.db.UpdateLiquidityPool(pool); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update liquidity pool"})
		return
	}

	c.JSON(http.StatusOK, pool)
}

// DeleteLiquidityPool deletes a liquidity pool
func (lpc *LiquidityPoolController) DeleteLiquidityPool(c *gin.Context) {
	id := c.Param("id")
	if err := lpc.db.DeleteLiquidityPool(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete liquidity pool"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Liquidity pool deleted successfully"})
}
