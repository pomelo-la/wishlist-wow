package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ROIHandler struct {
	db *gorm.DB
}

type ROICalculationRequest struct {
	InitiativeID string `json:"initiative_id" binding:"required"`
}

type ROICalculationResponse struct {
	InitiativeID string `json:"initiative_id"`
	Score        int    `json:"score"`
	Seeds        int    `json:"seeds"`
	ROI          int    `json:"roi"`
	Calculation  string `json:"calculation"`
}

func NewROIHandler(db *gorm.DB) *ROIHandler {
	return &ROIHandler{db: db}
}

// CalculateROI calculates ROI for an initiative
func (h *ROIHandler) CalculateROI(c *gin.Context) {
	var req ROICalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Get initiative data
	var initiative struct {
		ID        string `json:"id"`
		Score     int    `json:"score"`
		TechSeeds string `json:"tech_seeds"`
		UXSeeds   string `json:"ux_seeds"`
	}

	if err := h.db.Raw("SELECT id, score, tech_seeds, ux_seeds FROM initiatives WHERE id = ?", req.InitiativeID).Scan(&initiative).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	// Parse seeds values
	techSeeds := h.parseSeeds(initiative.TechSeeds)
	uxSeeds := h.parseSeeds(initiative.UXSeeds)
	totalSeeds := techSeeds + uxSeeds

	// Calculate ROI: Score / Seeds = ROI
	var roi int
	var calculation string

	if totalSeeds > 0 {
		roi = initiative.Score / totalSeeds
		calculation = fmt.Sprintf("%d / %d = %d", initiative.Score, totalSeeds, roi)
	} else {
		// If no seeds, ROI is 0 or undefined
		roi = 0
		calculation = fmt.Sprintf("%d / 0 = undefined (set to 0)", initiative.Score)
	}

	response := ROICalculationResponse{
		InitiativeID: initiative.ID,
		Score:        initiative.Score,
		Seeds:        totalSeeds,
		ROI:          roi,
		Calculation:  calculation,
	}

	c.JSON(http.StatusOK, response)
}

// parseSeeds converts string seeds to integer
func (h *ROIHandler) parseSeeds(seedsStr string) int {
	if seedsStr == "" || seedsStr == "0" {
		return 0
	}
	
	// Remove any non-numeric characters and parse
	cleaned := strings.TrimSpace(seedsStr)
	if cleaned == "" {
		return 0
	}
	
	seeds, err := strconv.Atoi(cleaned)
	if err != nil {
		return 0
	}
	
	return seeds
}
