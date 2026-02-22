package controllers

import (
	"net/http"
	"strconv"

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

// GetAllUsers gets all users
func (ac *AuthController) GetAllUsers(c *gin.Context) {
	db := models.GetDB()
	users, err := db.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	// Remove password fields from users
	var usersWithoutPassword []models.User
	for _, user := range users {
		userWithoutPassword := user
		userWithoutPassword.Password = ""
		usersWithoutPassword = append(usersWithoutPassword, userWithoutPassword)
	}

	c.JSON(http.StatusOK, usersWithoutPassword)
}

// GetUserByID gets a user by ID
func (ac *AuthController) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db := models.GetDB()
	user, found := db.GetUserByID(id)
	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Remove password field
	userWithoutPassword := *user
	userWithoutPassword.Password = ""

	c.JSON(http.StatusOK, userWithoutPassword)
}

// UpdateUserStatus updates a user's status
func (ac *AuthController) UpdateUserStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var statusUpdate struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&statusUpdate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status update"})
		return
	}

	db := models.GetDB()
	if err := db.UpdateUserStatus(id, statusUpdate.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User status updated successfully"})
}
