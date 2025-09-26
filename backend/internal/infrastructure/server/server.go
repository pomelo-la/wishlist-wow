package server

import (
	"os"

	"pomelo-wishlist/internal/interfaces/handlers"
	"pomelo-wishlist/internal/interfaces/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Server struct {
	db     *gorm.DB
	router *gin.Engine
}

func New(db *gorm.DB) *Server {
	s := &Server{
		db:     db,
		router: gin.Default(),
	}

	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	// Initialize services
	// scoringService := scoring.NewScoringService()
	// agentService := agent.NewAgentService(scoringService)

	// Initialize handlers
	jwtSecret := getEnv("JWT_SECRET", "your-secret-key")
	userHandler := handlers.NewUserHandler(s.db, jwtSecret)
	initiativeHandler := handlers.NewInitiativeHandler(s.db)
	// agentHandler := handlers.NewAgentHandler(s.db, agentService)
	slackHandler := handlers.NewSlackHandler()

	// Middleware
	s.router.Use(middleware.CORSMiddleware())

	// Health check
	s.router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Public routes
	auth := s.router.Group("/auth")
	{
		auth.POST("/login", userHandler.Login)
		auth.POST("/register", userHandler.Register)
	}

	// Protected routes
	api := s.router.Group("/api")
	// api.Use(middleware.AuthMiddleware(jwtSecret)) // Disabled for development
	{
		// User routes
		users := api.Group("/users")
		{
			users.GET("/me", userHandler.GetCurrentUser)
			users.GET("", userHandler.GetUsers)
			users.PUT("/:id", userHandler.UpdateUser)
		}

		// Initiative routes
		initiatives := api.Group("/initiatives")
		{
			initiatives.GET("", initiativeHandler.GetInitiatives)
			initiatives.POST("", initiativeHandler.CreateInitiative)
			initiatives.GET("/:id", initiativeHandler.GetInitiative)
			initiatives.PUT("/:id", initiativeHandler.UpdateInitiative)
			initiatives.DELETE("/:id", initiativeHandler.DeleteInitiative)
			initiatives.POST("/:id/status", initiativeHandler.UpdateStatus)
			initiatives.POST("/:id/score", initiativeHandler.CalculateScore)

			// Messages (chat functionality) - Temporarily disabled
			// initiatives.GET("/:id/messages", agentHandler.GetMessages)
			// initiatives.POST("/:id/messages", agentHandler.AddMessage)

			// Suggestions - Temporarily disabled
			// initiatives.GET("/:id/suggestions", agentHandler.GetSuggestions)
			// initiatives.POST("/:id/suggestions/apply", agentHandler.ApplySuggestion)
		}

		// Prioritized initiatives
		api.GET("/initiatives/prioritized", initiativeHandler.GetPrioritizedInitiatives)

		// Agent routes - Temporarily disabled
		// agent := api.Group("/agent")
		// {
		// 	agent.POST("/intake", agentHandler.IntakeIntervention)
		// 	agent.POST("/intake/complete", agentHandler.CompleteIntake)
		// 	agent.POST("/estimation", agentHandler.EstimationIntervention)
		// 	agent.POST("/scoring", agentHandler.ScoringIntervention)
		// }

		// Slack routes
		slack := api.Group("/slack")
		{
			slack.POST("/send-message", slackHandler.SendMessage)
			slack.GET("/users", slackHandler.GetUsers)
		}

		// Dashboard and analytics (future endpoints)
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/stats", s.getDashboardStats)
			dashboard.GET("/initiatives-by-status", s.getInitiativesByStatus)
			dashboard.GET("/initiatives-by-category", s.getInitiativesByCategory)
		}
	}
}

func (s *Server) Start(addr string) error {
	return s.router.Run(addr)
}

// Dashboard endpoints
func (s *Server) getDashboardStats(c *gin.Context) {
	var stats struct {
		TotalInitiatives       int64 `json:"total_initiatives"`
		DraftInitiatives       int64 `json:"draft_initiatives"`
		InReviewInitiatives    int64 `json:"in_review_initiatives"`
		PrioritizedInitiatives int64 `json:"prioritized_initiatives"`
	}

	s.db.Model(&struct{ ID int }{}).Table("initiatives").Count(&stats.TotalInitiatives)
	s.db.Model(&struct{ ID int }{}).Table("initiatives").Where("status = ?", "draft").Count(&stats.DraftInitiatives)
	s.db.Model(&struct{ ID int }{}).Table("initiatives").Where("status = ?", "in_review").Count(&stats.InReviewInitiatives)
	s.db.Model(&struct{ ID int }{}).Table("initiatives").Where("status = ?", "prioritized").Count(&stats.PrioritizedInitiatives)

	c.JSON(200, stats)
}

func (s *Server) getInitiativesByStatus(c *gin.Context) {
	var results []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}

	s.db.Model(&struct{ ID int }{}).Table("initiatives").
		Select("status, count(*) as count").
		Group("status").
		Find(&results)

	c.JSON(200, gin.H{"data": results})
}

func (s *Server) getInitiativesByCategory(c *gin.Context) {
	var results []struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
	}

	s.db.Model(&struct{ ID int }{}).Table("initiatives").
		Select("category, count(*) as count").
		Group("category").
		Find(&results)

	c.JSON(200, gin.H{"data": results})
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
