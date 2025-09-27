package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"pomelo-wishlist/internal/application/scoring"
	"pomelo-wishlist/internal/domain"
)

type KanbanMoveHandler struct {
	db             *gorm.DB
	scoringService *scoring.ScoringService
}

func NewKanbanMoveHandler(db *gorm.DB) *KanbanMoveHandler {
	return &KanbanMoveHandler{
		db:             db,
		scoringService: scoring.NewScoringService(),
	}
}

type KanbanMoveRequest struct {
	NewStatus      string `json:"new_status" binding:"required"`
	PreviousStatus string `json:"previous_status"`
	MovedBy        string `json:"moved_by"`
}

type KanbanMoveResponse struct {
	InitiativeID string `json:"initiative_id"`
	NewStatus    string `json:"new_status"`
	Score        *int   `json:"score,omitempty"`
	Message      string `json:"message"`
}

type KanbanStatusesResponse struct {
	Statuses []string `json:"statuses"`
}

// GetKanbanStatuses returns the available Kanban statuses
func (h *KanbanMoveHandler) GetKanbanStatuses(c *gin.Context) {
	statuses := []string{
		"Backlog",
		"Iniciativas cargadas a revisar",
		"Iniciativas a estimar",
		"Priorizacion final",
		"Roadmap del Q",
	}

	c.JSON(http.StatusOK, KanbanStatusesResponse{
		Statuses: statuses,
	})
}

// MoveInitiative moves an initiative to a new status
func (h *KanbanMoveHandler) MoveInitiative(c *gin.Context) {
	initiativeID := c.Param("id")

	var request KanbanMoveRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Validate status
	validStatuses := []string{
		"Backlog",
		"Iniciativas cargadas a revisar",
		"Iniciativas a estimar",
		"Priorizacion final",
		"Roadmap del Q",
	}

	isValidStatus := false
	for _, status := range validStatuses {
		if request.NewStatus == status {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	// Check if initiative exists and get full data for scoring
	var initiative domain.Initiative
	if err := h.db.Raw("SELECT id, title, summary, status, category, vertical, client_type, country, systemic_risk, economic_impact, competitive_approach FROM initiatives WHERE id = ?", initiativeID).Scan(&initiative).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	// Update the initiative status
	updates := map[string]interface{}{
		"status":     request.NewStatus,
		"updated_at": time.Now(),
	}

	// Check if we need to calculate score
	shouldCalculateScore := false
	if (initiative.Status == domain.StatusBacklog && request.NewStatus == "Iniciativas cargadas a revisar") ||
		(initiative.Status == domain.StatusIniciativasCargadasRevisar && request.NewStatus == "Iniciativas a estimar") {
		shouldCalculateScore = true
	}

	// Calculate real score if needed
	if shouldCalculateScore {
		// Use the real scoring system
		scoreBreakdown, err := h.scoringService.CalculateScore(initiative)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate score"})
			return
		}
		updates["score"] = scoreBreakdown.TotalScore
	}

	// Update the initiative
	if err := h.db.Model(&initiative).Where("id = ?", initiativeID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update initiative"})
		return
	}

	// Prepare response
	response := KanbanMoveResponse{
		InitiativeID: initiativeID,
		NewStatus:    request.NewStatus,
		Message:      "Initiative moved successfully",
	}

	// Add score to response if it was calculated
	if shouldCalculateScore {
		score := updates["score"].(int)
		response.Score = &score
		response.Message = "Initiative moved successfully and score calculated"
	}

	c.JSON(http.StatusOK, response)
}
