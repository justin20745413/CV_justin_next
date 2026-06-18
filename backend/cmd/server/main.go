package main

import (
	"log"
	"os"
	"time"

	"cvbackend/internal/db"
	"cvbackend/internal/handlers"
	"cvbackend/internal/middleware"
	"cvbackend/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, relying on environment variables")
	}

	conn := db.Connect()
	if err := conn.AutoMigrate(&models.User{}, &models.RefreshToken{}, &models.LoginRecord{}); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is not set")
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	authHandler := &handlers.AuthHandler{
		DB:         conn,
		JWTSecret:  jwtSecret,
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 7 * 24 * time.Hour,
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigin},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	authLimiter := middleware.NewIPRateLimiter(5, time.Minute)

	api := router.Group("/api/auth")
	api.POST("/register", authLimiter, authHandler.Register)
	api.POST("/login", authLimiter, authHandler.Login)
	api.POST("/refresh", authLimiter, authHandler.Refresh)
	api.POST("/logout", middleware.RequireAuth(jwtSecret), authHandler.Logout)
	api.GET("/me", middleware.RequireAuth(jwtSecret), authHandler.Me)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("server listening on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
