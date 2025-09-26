package handlers

import (
	"fmt"
	"net/http"

	"pomelo-wishlist/internal/application/agent"
	"pomelo-wishlist/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AgentHandler struct {
	db           *gorm.DB
	agentService *agent.AgentService
}

func NewAgentHandler(db *gorm.DB, agentService *agent.AgentService) *AgentHandler {
	return &AgentHandler{
		db:           db,
		agentService: agentService,
	}
}

// POST /agent/intake
func (h *AgentHandler) IntakeIntervention(c *gin.Context) {
	var req agent.IntakeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.agentService.IntakeIntervention(c.Request.Context(), req)
	if err != nil {
		fmt.Printf("IntakeIntervention error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to process intake intervention: %v", err)})
		return
	}

	c.JSON(http.StatusOK, response)
}

// POST /agent/intake/complete
func (h *AgentHandler) CompleteIntake(c *gin.Context) {
	var req struct {
		Initiative *domain.Initiative     `json:"initiative" binding:"required"`
		Context    map[string]interface{} `json:"context"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (for now, create a default user)
	userID, exists := c.Get("user_id")
	if !exists {
		// For development, create a default user
		userID = uuid.New()
	}

	// Set creator and status
	req.Initiative.CreatorID = userID.(uuid.UUID)
	req.Initiative.Status = domain.StatusBacklog

	// Create initiative in database
	if err := h.db.Create(req.Initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative"})
		return
	}

	// Load the creator information
	var user domain.User
	h.db.First(&user, "id = ?", userID)
	req.Initiative.Creator = user

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Initiative created successfully",
		"initiative": req.Initiative,
	})
}

// POST /agent/estimation
func (h *AgentHandler) EstimationIntervention(c *gin.Context) {
	var req agent.EstimationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.agentService.EstimationIntervention(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process estimation intervention"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// POST /agent/scoring
func (h *AgentHandler) ScoringIntervention(c *gin.Context) {
	var req agent.ScoringRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.agentService.ScoringIntervention(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process scoring intervention"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// POST /initiatives/:id/messages
func (h *AgentHandler) AddMessage(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		Content string   `json:"content" binding:"required"`
		Tags    []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userRole, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	// Verify initiative exists
	var initiative domain.Initiative
	if err := h.db.First(&initiative, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	message := domain.Message{
		ID:           uuid.New(),
		InitiativeID: id,
		AuthorID:     userID.(uuid.UUID),
		AuthorRole:   userRole.(domain.UserRole),
		Content:      req.Content,
		Tags:         req.Tags,
	}

	if err := h.db.Create(&message).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	// Load the user information for the response
	var user domain.User
	h.db.First(&user, "id = ?", userID)
	message.Author = user

	c.JSON(http.StatusCreated, message)
}

// GET /initiatives/:id/messages
func (h *AgentHandler) GetMessages(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var messages []domain.Message
	if err := h.db.Preload("Author").Where("initiative_id = ?", id).Order("created_at ASC").Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": messages,
	})
}

// POST /initiatives/:id/suggestions/apply
func (h *AgentHandler) ApplySuggestion(c *gin.Context) {
	initiativeID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid initiative ID format"})
		return
	}

	var req struct {
		SuggestionID uuid.UUID `json:"suggestion_id" binding:"required"`
		Action       string    `json:"action" binding:"required"` // "accept" or "reject"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get suggestion
	var suggestion domain.Suggestion
	if err := h.db.First(&suggestion, "id = ? AND initiative_id = ?", req.SuggestionID, initiativeID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Suggestion not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch suggestion"})
		return
	}

	// Update suggestion status
	if req.Action == "accept" {
		suggestion.Status = domain.SuggestionApplied
	} else if req.Action == "reject" {
		suggestion.Status = domain.SuggestionRejected
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action. Must be 'accept' or 'reject'"})
		return
	}

	if err := h.db.Save(&suggestion).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update suggestion"})
		return
	}

	// If accepted, apply the suggestion to the initiative
	if req.Action == "accept" {
		if err := h.applySuggestionToInitiative(initiativeID, suggestion); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to apply suggestion to initiative"})
			return
		}
	}

	c.JSON(http.StatusOK, suggestion)
}

// GET /initiatives/:id/suggestions
func (h *AgentHandler) GetSuggestions(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var suggestions []domain.Suggestion
	if err := h.db.Where("initiative_id = ?", id).Order("created_at DESC").Find(&suggestions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch suggestions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": suggestions,
	})
}

func (h *AgentHandler) applySuggestionToInitiative(initiativeID uuid.UUID, suggestion domain.Suggestion) error {
	// Get initiative
	var initiative domain.Initiative
	if err := h.db.First(&initiative, "id = ?", initiativeID).Error; err != nil {
		return err
	}

	// Apply suggestion based on field
	switch suggestion.Field {
	case "title":
		initiative.Title = suggestion.SuggestedValue
	case "summary":
		initiative.Summary = suggestion.SuggestedValue
	case "description":
		initiative.Description = suggestion.SuggestedValue
	case "category":
		initiative.Category = domain.Category(suggestion.SuggestedValue)
	case "vertical":
		initiative.Vertical = domain.Vertical(suggestion.SuggestedValue)
	case "client_type":
		initiative.ClientType = domain.ClientType(suggestion.SuggestedValue)
	case "economic_impact_type":
		initiative.EconomicImpactType = domain.EconomicImpactType(suggestion.SuggestedValue)
	case "innovation_level":
		initiative.InnovationLevel = domain.InnovationLevel(suggestion.SuggestedValue)
	case "systemic_risk":
		initiative.SystemicRisk = domain.RiskLevel(suggestion.SuggestedValue)
	}

	// Save updated initiative
	return h.db.Save(&initiative).Error
}
