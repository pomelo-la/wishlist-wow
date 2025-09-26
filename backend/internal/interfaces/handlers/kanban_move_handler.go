package handlers

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type KanbanMoveHandler struct {
	db *gorm.DB
}

func NewKanbanMoveHandler(db *gorm.DB) *KanbanMoveHandler {
	return &KanbanMoveHandler{db: db}
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

	// Check if initiative exists
	var initiative struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Score  int    `json:"score"`
	}

	if err := h.db.Table("initiatives").Select("id, status, score").Where("id = ?", initiativeID).First(&initiative).Error; err != nil {
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
	if (initiative.Status == "Backlog" && request.NewStatus == "Iniciativas cargadas a revisar") ||
		(initiative.Status == "Iniciativas cargadas a revisar" && request.NewStatus == "Iniciativas a estimar") {
		shouldCalculateScore = true
	}

	// Calculate mock score if needed
	if shouldCalculateScore {
		// Generate random score between 80-100
		rand.Seed(time.Now().UnixNano())
		mockScore := 80 + rand.Intn(21) // 80-100
		updates["score"] = mockScore
	}

	// Update the initiative
	if err := h.db.Table("initiatives").Where("id = ?", initiativeID).Updates(updates).Error; err != nil {
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
