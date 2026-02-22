package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	JWT      JWTConfig
	Database DatabaseConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Host string
	Port int
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	SecretKey       string
	ExpirationHours int
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Type     string
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Warning: .env file not found")
	}

	// Server configuration
	host := getEnv("HOST", "0.0.0.0")
	portStr := getEnv("PORT", "8080")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return nil, fmt.Errorf("invalid PORT: %v", err)
	}

	// JWT configuration
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	jwtExpirationHoursStr := getEnv("JWT_EXPIRATION_HOURS", "24")
	jwtExpirationHours, err := strconv.Atoi(jwtExpirationHoursStr)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRATION_HOURS: %v", err)
	}

	// Database configuration
	dbType := getEnv("DB_TYPE", "mysql")
	dbHost := getEnv("DB_HOST", "")
	if dbHost == "" {
		return nil, fmt.Errorf("DB_HOST is required")
	}
	dbPortStr := getEnv("DB_PORT", "")
	if dbPortStr == "" {
		return nil, fmt.Errorf("DB_PORT is required")
	}
	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}
	dbUser := getEnv("DB_USER", "")
	if dbUser == "" {
		return nil, fmt.Errorf("DB_USER is required")
	}
	dbPassword := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "")
	if dbName == "" {
		return nil, fmt.Errorf("DB_NAME is required")
	}

	return &Config{
		Server: ServerConfig{
			Host: host,
			Port: port,
		},
		JWT: JWTConfig{
			SecretKey:       jwtSecret,
			ExpirationHours: jwtExpirationHours,
		},
		Database: DatabaseConfig{
			Type:     dbType,
			Host:     dbHost,
			Port:     dbPort,
			User:     dbUser,
			Password: dbPassword,
			DBName:   dbName,
		},
	}, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}