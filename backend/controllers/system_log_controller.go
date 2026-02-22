package controllers

import (
	"net/http"

	"github.com/dex-amm/backend/config"
	"github.com/dex-amm/backend/models"
	"github.com/gin-gonic/gin"
)

// SystemLogController handles system log requests
type SystemLogController struct {
	config *config.Config
	db     *models.DB
}

// NewSystemLogController creates a new system log controller
func NewSystemLogController(cfg *config.Config, db *models.DB) *SystemLogController {
	return &SystemLogController{
		config: cfg,
		db:     db,
	}
}

// GetAllSystemLogs gets all system logs
func (slc *SystemLogController) GetAllSystemLogs(c *gin.Context) {
	logs, err := slc.db.GetAllSystemLogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system logs"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// GetSystemLogsByCategory gets system logs by category
func (slc *SystemLogController) GetSystemLogsByCategory(c *gin.Context) {
	category := c.Param("category")
	logs, err := slc.db.GetSystemLogsByCategory(category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get system logs by category"})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// CreateSystemLog creates a new system log
func (slc *SystemLogController) CreateSystemLog(c *gin.Context) {
	var log models.SystemLog
	if err := c.ShouldBindJSON(&log); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid system log data"})
		return
	}

	if err := slc.db.CreateSystemLog(log); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create system log"})
		return
	}

	c.JSON(http.StatusCreated, log)
}
