package handlers

import (
	"net/http"
	"strconv"

	"pomelo-wishlist/internal/domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SimpleInitiativeHandler struct {
	db *gorm.DB
}

func NewSimpleInitiativeHandler(db *gorm.DB) *SimpleInitiativeHandler {
	return &SimpleInitiativeHandler{db: db}
}

// CreateSimpleInitiative creates a new simple initiative
func (h *SimpleInitiativeHandler) CreateSimpleInitiative(c *gin.Context) {
	var req struct {
		Category         string `json:"category"`
		Vertical         string `json:"vertical"`
		ClientType       string `json:"client_type"`
		Country          string `json:"country"`
		SystemicRisk     string `json:"systemic_risk"`
		EconomicImpact   string `json:"economic_impact"`
		ExperienceImpact string `json:"experience_impact"`
		CompetitiveFocus string `json:"competitive_focus"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values if not provided
	initiative := domain.SimpleInitiative{
		Category:         getDefaultValue(req.Category, "Mandates / Regulatorio / Riesgo"),
		Vertical:         getDefaultValue(req.Vertical, "Processing"),
		ClientType:       getDefaultValue(req.ClientType, "Top Issuer"),
		Country:          getDefaultValue(req.Country, "Brazil"),
		SystemicRisk:     getDefaultValue(req.SystemicRisk, "Bajo"),
		EconomicImpact:   getDefaultValue(req.EconomicImpact, "Impacto menor o difícil de cuantificar"),
		ExperienceImpact: getDefaultValue(req.ExperienceImpact, "Aprobación"),
		CompetitiveFocus: getDefaultValue(req.CompetitiveFocus, "Paridad con competencia"),
	}

	if err := h.db.Create(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Simple initiative created successfully",
		"data":    initiative,
	})
}

// getDefaultValue returns the provided value if not empty, otherwise returns the default
func getDefaultValue(value, defaultValue string) string {
	if value == "" {
		return defaultValue
	}
	return value
}

// GetSimpleInitiatives gets all simple initiatives
func (h *SimpleInitiativeHandler) GetSimpleInitiatives(c *gin.Context) {
	var initiatives []domain.SimpleInitiative

	if err := h.db.Find(&initiatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiatives: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": initiatives,
	})
}

// GetSimpleInitiative gets a simple initiative by ID
func (h *SimpleInitiativeHandler) GetSimpleInitiative(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var initiative domain.SimpleInitiative
	if err := h.db.First(&initiative, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": initiative,
	})
}

// UpdateSimpleInitiative updates a simple initiative
func (h *SimpleInitiativeHandler) UpdateSimpleInitiative(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Category         string `json:"category"`
		Vertical         string `json:"vertical"`
		ClientType       string `json:"client_type"`
		Country          string `json:"country"`
		SystemicRisk     string `json:"systemic_risk"`
		EconomicImpact   string `json:"economic_impact"`
		ExperienceImpact string `json:"experience_impact"`
		CompetitiveFocus string `json:"competitive_focus"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var initiative domain.SimpleInitiative
	if err := h.db.First(&initiative, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative: " + err.Error()})
		return
	}

	// Update fields
	if req.Category != "" {
		initiative.Category = req.Category
	}
	if req.Vertical != "" {
		initiative.Vertical = req.Vertical
	}
	if req.ClientType != "" {
		initiative.ClientType = req.ClientType
	}
	if req.Country != "" {
		initiative.Country = req.Country
	}
	if req.SystemicRisk != "" {
		initiative.SystemicRisk = req.SystemicRisk
	}
	if req.EconomicImpact != "" {
		initiative.EconomicImpact = req.EconomicImpact
	}
	if req.ExperienceImpact != "" {
		initiative.ExperienceImpact = req.ExperienceImpact
	}
	if req.CompetitiveFocus != "" {
		initiative.CompetitiveFocus = req.CompetitiveFocus
	}

	if err := h.db.Save(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update initiative: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Simple initiative updated successfully",
		"data":    initiative,
	})
}

// DeleteSimpleInitiative deletes a simple initiative
func (h *SimpleInitiativeHandler) DeleteSimpleInitiative(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.db.Delete(&domain.SimpleInitiative{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete initiative: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Simple initiative deleted successfully",
	})
}
