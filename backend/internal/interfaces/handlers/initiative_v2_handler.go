package handlers

import (
	"net/http"
	"time"

	"pomelo-wishlist/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InitiativeV2Handler struct {
	db *gorm.DB
}

func NewInitiativeV2Handler(db *gorm.DB) *InitiativeV2Handler {
	return &InitiativeV2Handler{db: db}
}

// CreateInitiativeV2 creates a new initiative with the new structure
func (h *InitiativeV2Handler) CreateInitiativeV2(c *gin.Context) {
	var req struct {
		Title                     string  `json:"title" binding:"required"`
		Description               string  `json:"description"`
		Status                    string  `json:"status" binding:"required"`
		CreatedBy                 string  `json:"createdBy" binding:"required"`
		Quarter                   string  `json:"quarter"`
		Score                     float64 `json:"score"`
		Category                  string  `json:"category"`
		Vertical                  string  `json:"vertical"`
		ClientType                string  `json:"clientType"`
		Country                   string  `json:"country"`
		SystemicRisk              string  `json:"systemicRisk"`
		EconomicImpact            string  `json:"economicImpact"`
		EconomicImpactDescription string  `json:"economicImpactDescription"`
		ExperienceImpact          string  `json:"experienceImpact"` // JSON array as string
		CompetitiveApproach       string  `json:"competitiveApproach"`
		ExecutiveSummary          string  `json:"executiveSummary"`
		ROI                       float64 `json:"roi"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Generate UUID for ID
	id := uuid.New().String()

	initiative := domain.InitiativeV2{
		ID:                        id,
		Title:                     req.Title,
		Description:               req.Description,
		Status:                    req.Status,
		CreatedBy:                 req.CreatedBy,
		CreatedAt:                 time.Now(),
		Quarter:                   req.Quarter,
		Score:                     req.Score,
		Category:                  req.Category,
		Vertical:                  req.Vertical,
		ClientType:                req.ClientType,
		Country:                   req.Country,
		SystemicRisk:              req.SystemicRisk,
		EconomicImpact:            req.EconomicImpact,
		EconomicImpactDescription: req.EconomicImpactDescription,
		ExperienceImpact:          req.ExperienceImpact,
		CompetitiveApproach:       req.CompetitiveApproach,
		ExecutiveSummary:          req.ExecutiveSummary,
		ROI:                       req.ROI,
		UpdatedAt:                 time.Now(),
	}

	if err := h.db.Create(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Initiative created successfully",
		"initiative": initiative,
	})
}

// GetInitiativesV2 gets all initiatives with the new structure
func (h *InitiativeV2Handler) GetInitiativesV2(c *gin.Context) {
	var initiatives []domain.InitiativeV2
	if err := h.db.Find(&initiatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiatives"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": initiatives})
}

// GetInitiativeV2 gets an initiative by ID
func (h *InitiativeV2Handler) GetInitiativeV2(c *gin.Context) {
	id := c.Param("id")

	var initiative domain.InitiativeV2
	if err := h.db.Where("id = ?", id).First(&initiative).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": initiative})
}

// UpdateInitiativeV2 updates an existing initiative
func (h *InitiativeV2Handler) UpdateInitiativeV2(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Title                     string  `json:"title"`
		Description               string  `json:"description"`
		Status                    string  `json:"status"`
		Quarter                   string  `json:"quarter"`
		Score                     float64 `json:"score"`
		Category                  string  `json:"category"`
		Vertical                  string  `json:"vertical"`
		ClientType                string  `json:"clientType"`
		Country                   string  `json:"country"`
		SystemicRisk              string  `json:"systemicRisk"`
		EconomicImpact            string  `json:"economicImpact"`
		EconomicImpactDescription string  `json:"economicImpactDescription"`
		ExperienceImpact          string  `json:"experienceImpact"`
		CompetitiveApproach       string  `json:"competitiveApproach"`
		ExecutiveSummary          string  `json:"executiveSummary"`
		ROI                       float64 `json:"roi"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var initiative domain.InitiativeV2
	if err := h.db.Where("id = ?", id).First(&initiative).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Update fields
	initiative.Title = req.Title
	initiative.Description = req.Description
	initiative.Status = req.Status
	initiative.Quarter = req.Quarter
	initiative.Score = req.Score
	initiative.Category = req.Category
	initiative.Vertical = req.Vertical
	initiative.ClientType = req.ClientType
	initiative.Country = req.Country
	initiative.SystemicRisk = req.SystemicRisk
	initiative.EconomicImpact = req.EconomicImpact
	initiative.EconomicImpactDescription = req.EconomicImpactDescription
	initiative.ExperienceImpact = req.ExperienceImpact
	initiative.CompetitiveApproach = req.CompetitiveApproach
	initiative.ExecutiveSummary = req.ExecutiveSummary
	initiative.ROI = req.ROI
	initiative.UpdatedAt = time.Now()

	if err := h.db.Save(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update initiative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Initiative updated successfully", "data": initiative})
}

// DeleteInitiativeV2 deletes an initiative
func (h *InitiativeV2Handler) DeleteInitiativeV2(c *gin.Context) {
	id := c.Param("id")

	if err := h.db.Where("id = ?", id).Delete(&domain.InitiativeV2{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete initiative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Initiative deleted successfully"})
}
