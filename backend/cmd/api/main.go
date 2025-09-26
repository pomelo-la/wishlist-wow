package main

import (
	"log"
	"os"

	"pomelo-wishlist/internal/infrastructure/database"
	"pomelo-wishlist/internal/infrastructure/server"
)

func main() {
	// Initialize database
	db, err := database.Initialize()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}

	// Initialize server
	srv := server.New(db)

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := srv.Start(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}