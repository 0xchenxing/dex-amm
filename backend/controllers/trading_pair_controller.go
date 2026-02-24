package controllers

import (
	"bytes"
	"fmt"
	"io"
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
	// 打印请求信息
	fmt.Println("Received POST /api/trading-pairs request")
	fmt.Println("Authorization header:", c.GetHeader("Authorization"))

	// 打印完整的请求体
	body, _ := io.ReadAll(c.Request.Body)
	fmt.Println("Request body:", string(body))
	// 重置请求体，否则ShouldBindJSON会失败
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var pair models.TradingPair
	if err := c.ShouldBindJSON(&pair); err != nil {
		fmt.Printf("Error binding JSON: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid trading pair data: %v", err)})
		return
	}

	if err := validateTradingPair(pair); err != nil {
		fmt.Printf("Validation error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Validation error: %v", err)})
		return
	}

	// 打印交易对数据
	fmt.Printf("Trading pair data: %+v\n", pair)

	if err := tpc.db.CreateTradingPair(pair); err != nil {
		fmt.Printf("Error creating trading pair: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create trading pair: %v", err)})
		return
	}

	fmt.Println("Trading pair created successfully")
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

func validateTradingPair(pair models.TradingPair) error {
	if pair.ID == "" {
		return fmt.Errorf("ID is required")
	}
	if pair.BaseToken == "" {
		return fmt.Errorf("BaseToken is required")
	}
	if pair.QuoteToken == "" {
		return fmt.Errorf("QuoteToken is required")
	}
	if pair.BaseTokenAddr == "" {
		return fmt.Errorf("BaseTokenAddr is required")
	}
	if pair.QuoteTokenAddr == "" {
		return fmt.Errorf("QuoteTokenAddr is required")
	}
	return nil
}
