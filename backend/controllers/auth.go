package controllers

import (
	"net/http"

	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/middleware"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// AuthController handles authentication requests
type AuthController struct {
	config *config.Config
}

// NewAuthController creates a new auth controller
func NewAuthController(cfg *config.Config) *AuthController {
	return &AuthController{
		config: cfg,
	}
}

// Login handles user login
func (ac *AuthController) Login(c *gin.Context) {
	// Parse login request
	var loginReq models.UserLoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Find user by username and password
	db := models.GetDB()
	user, found := db.FindUserByUsernameAndPassword(loginReq.Username, loginReq.Password, loginReq.Role)
	if !found {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username, password, or role"})
		return
	}

	// Update last login time
	db.UpdateLastLogin(user.ID)

	// Generate JWT token
	token, err := middleware.GenerateToken(user, ac.config)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Create a copy of the user without the password field
	userWithoutPassword := *user
	userWithoutPassword.Password = ""

	// Return response
	response := models.UserLoginResponse{
		Token: token,
		User:  userWithoutPassword,
	}

	c.JSON(http.StatusOK, response)
}

// GetCurrentUser gets the current authenticated user
func (ac *AuthController) GetCurrentUser(c *gin.Context) {
	// Get user ID from context (set by JWT middleware)
	userID, exists := middleware.GetUserIDFromContext(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Find user by ID
	db := models.GetDB()
	user, found := db.GetUserByID(userID)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Create a copy of the user without the password field
	userWithoutPassword := *user
	userWithoutPassword.Password = ""

	c.JSON(http.StatusOK, userWithoutPassword)
}
