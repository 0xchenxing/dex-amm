package models

import (
	"sync"
	"time"
)

// DB represents an in-memory database
type DB struct {
	users  map[int]User
	mu     sync.RWMutex
	nextID int
}

// NewDB creates a new in-memory database
func NewDB() *DB {
	db := &DB{
		users:  make(map[int]User),
		nextID: 1,
	}

	// Initialize with demo users
	for _, user := range DemoUsers {
		user.ID = db.nextID
		db.users[db.nextID] = user
		db.nextID++
	}

	return db
}

// FindUserByUsernameAndPassword finds a user by username and password
func (db *DB) FindUserByUsernameAndPassword(username, password, role string) (*User, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	for _, user := range db.users {
		if user.Username == username && user.Password == password && user.Role == role {
			return &user, true
		}
	}

	return nil, false
}

// UpdateLastLogin updates the last login time for a user
func (db *DB) UpdateLastLogin(userID int) bool {
	db.mu.Lock()
	defer db.mu.Unlock()

	user, exists := db.users[userID]
	if !exists {
		return false
	}

	user.LastLogin = time.Now()
	db.users[userID] = user
	return true
}

// GetUserByID gets a user by ID
func (db *DB) GetUserByID(userID int) (*User, bool) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	user, exists := db.users[userID]
	if !exists {
		return nil, false
	}

	return &user, true
}

// Global database instance
var globalDB = NewDB()

// GetDB returns the global database instance
func GetDB() *DB {
	return globalDB
}