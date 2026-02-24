package routes

import (
	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/controllers"
	"github.com/dex-amm/backend/middleware"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all routes for the application
func SetupRoutes(router *gin.Engine) error {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		return err
	}

	// Initialize JWT middleware
	middleware.InitializeJWT(cfg)

	// Get database instance
	db := models.GetDB()

	// Create controllers
	authController := controllers.NewAuthController(cfg)
	tradingPairController := controllers.NewTradingPairController(cfg, db)
	liquidityPoolController := controllers.NewLiquidityPoolController(cfg, db)
	tradeController := controllers.NewTradeController(cfg, db)
	systemLogController := controllers.NewSystemLogController(cfg, db)
	governanceProposalController := controllers.NewGovernanceProposalController(cfg, db)
	arbitrageOpportunityController := controllers.NewArbitrageOpportunityController(cfg, db)

	// API routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authController.Login)
			auth.GET("/me", middleware.JWTAuthMiddleware(), authController.GetCurrentUser)
		}

		// User routes
		users := api.Group("/users")
		{
			users.GET("", middleware.JWTAuthMiddleware(), authController.GetAllUsers)
			users.GET("/:id", middleware.JWTAuthMiddleware(), authController.GetUserByID)
			users.PATCH("/:id/status", middleware.JWTAuthMiddleware(), authController.UpdateUserStatus)
		}

		// Trading pair routes
		tradingPairs := api.Group("/trading-pairs")
		{
			tradingPairs.GET("", tradingPairController.GetAllTradingPairs)
			tradingPairs.GET("/:id", tradingPairController.GetTradingPairByID)
			tradingPairs.POST("", middleware.JWTAuthMiddleware(), tradingPairController.CreateTradingPair)
			tradingPairs.PUT("/:id", middleware.JWTAuthMiddleware(), tradingPairController.UpdateTradingPair)
			tradingPairs.DELETE("/:id", middleware.JWTAuthMiddleware(), tradingPairController.DeleteTradingPair)
		}

		// Liquidity pool routes
		liquidityPools := api.Group("/liquidity-pools")
		{
			liquidityPools.GET("", liquidityPoolController.GetAllLiquidityPools)
			liquidityPools.GET("/:id", liquidityPoolController.GetLiquidityPoolByID)
			liquidityPools.POST("", middleware.JWTAuthMiddleware(), liquidityPoolController.CreateLiquidityPool)
			liquidityPools.PUT("/:id", middleware.JWTAuthMiddleware(), liquidityPoolController.UpdateLiquidityPool)
			liquidityPools.DELETE("/:id", middleware.JWTAuthMiddleware(), liquidityPoolController.DeleteLiquidityPool)
		}

		// Trade routes
		trades := api.Group("/trades")
		{
			trades.GET("", tradeController.GetAllTrades)
			trades.GET("/:id", tradeController.GetTradeByID)
			trades.GET("/user/:userId", tradeController.GetTradesByUser)
			trades.POST("", middleware.JWTAuthMiddleware(), tradeController.CreateTrade)
		}

		// System log routes
		systemLogs := api.Group("/system-logs")
		{
			systemLogs.GET("", systemLogController.GetAllSystemLogs)
			systemLogs.GET("/category/:category", systemLogController.GetSystemLogsByCategory)
			systemLogs.POST("", middleware.JWTAuthMiddleware(), systemLogController.CreateSystemLog)
		}

		// Governance routes
		governance := api.Group("/governance")
		{
			proposals := governance.Group("/proposals")
			{
				proposals.GET("", governanceProposalController.GetAllGovernanceProposals)
				proposals.POST("", middleware.JWTAuthMiddleware(), governanceProposalController.CreateGovernanceProposal)
				proposals.POST("/:id/vote", middleware.JWTAuthMiddleware(), governanceProposalController.VoteOnGovernanceProposal)
			}
		}

		// Arbitrage routes
		arbitrage := api.Group("/arbitrage")
		{
			arbitrage.GET("/opportunities", arbitrageOpportunityController.GetAllArbitrageOpportunities)
			arbitrage.POST("/execute", arbitrageOpportunityController.ExecuteArbitrage)
			arbitrage.PATCH("/auto-trading", arbitrageOpportunityController.ToggleAutoTrading)
		}
	}

	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	return nil
}
