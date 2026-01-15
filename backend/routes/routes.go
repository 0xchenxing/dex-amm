package routes

import (
	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/controllers"
	"github.com/dex-amm/backend/middleware"
	"github.com/gin-gonic/gin"
)

// SetupRoutes sets up all routes for the application
func SetupRoutes(router *gin.Engine) {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		panic("Failed to load configuration: " + err.Error())
	}

	// Initialize JWT middleware
	middleware.InitializeJWT(cfg)

	// Create controllers
	authController := controllers.NewAuthController(cfg)

	// API routes
	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", authController.Login)
			auth.GET("/me", middleware.JWTAuthMiddleware(), authController.GetCurrentUser)
		}
	}

	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}