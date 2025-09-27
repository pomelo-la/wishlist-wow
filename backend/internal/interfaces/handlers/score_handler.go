package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ScoreHandler struct {
	db *gorm.DB
}

type ScoreResponse struct {
	InitiativeID string `json:"initiative_id"`
	Score        int    `json:"score"`
	Status       string `json:"status"`
	Message      string `json:"message"`
}

func NewScoreHandler(db *gorm.DB) *ScoreHandler {
	return &ScoreHandler{db: db}
}

// GetScore gets the current score for an initiative
func (h *ScoreHandler) GetScore(c *gin.Context) {
	initiativeID := c.Param("id")
	if initiativeID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Initiative ID is required"})
		return
	}

	// Get initiative data
	var initiative struct {
		ID     string `json:"id"`
		Score  int    `json:"score"`
		Status string `json:"status"`
	}

	if err := h.db.Raw("SELECT id, score, status FROM initiatives WHERE id = ?", initiativeID).Scan(&initiative).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	// Determine message based on score
	var message string
	if initiative.Score == 0 {
		message = "Score not calculated yet"
	} else if initiative.Score < 50 {
		message = "Low priority initiative"
	} else if initiative.Score < 100 {
		message = "Medium priority initiative"
	} else {
		message = "High priority initiative"
	}

	response := ScoreResponse{
		InitiativeID: initiative.ID,
		Score:        initiative.Score,
		Status:       initiative.Status,
		Message:      message,
	}

	c.JSON(http.StatusOK, response)
}
