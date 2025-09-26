package handlers

import (
	"net/http"
	"strconv"

	"pomelo-wishlist/internal/application/agent"
	"pomelo-wishlist/internal/application/scoring"
	"pomelo-wishlist/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InitiativeHandler struct {
	db             *gorm.DB
	agentService   *agent.AgentService
	scoringService *scoring.ScoringService
}

func NewInitiativeHandler(db *gorm.DB, agentService *agent.AgentService, scoringService *scoring.ScoringService) *InitiativeHandler {
	return &InitiativeHandler{
		db:             db,
		agentService:   agentService,
		scoringService: scoringService,
	}
}

// GET /initiatives
func (h *InitiativeHandler) GetInitiatives(c *gin.Context) {
	var initiatives []domain.Initiative

	query := h.db.Preload("Messages").Preload("Suggestions")

	// Apply filters
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if country := c.Query("country"); country != "" {
		query = query.Where("? = ANY(countries)", country)
	}
	if clientType := c.Query("client_type"); clientType != "" {
		query = query.Where("client_type = ?", clientType)
	}

	// Apply sorting
	sortBy := c.DefaultQuery("sort", "created_at")
	order := c.DefaultQuery("order", "desc")
	query = query.Order(sortBy + " " + order)

	// Apply pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	if err := query.Offset(offset).Limit(limit).Find(&initiatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiatives"})
		return
	}

	// Get total count
	var total int64
	h.db.Model(&domain.Initiative{}).Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"data":  initiatives,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GET /initiatives/:id
func (h *InitiativeHandler) GetInitiative(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var initiative domain.Initiative
	if err := h.db.Preload("Messages").Preload("Suggestions").Preload("AuditLogs").First(&initiative, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	c.JSON(http.StatusOK, initiative)
}

// POST /initiatives
func (h *InitiativeHandler) CreateInitiative(c *gin.Context) {
	var req struct {
		Title       string `json:"title" binding:"required"`
		Description string `json:"description" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	initiative := domain.Initiative{
		ID:          uuid.New(),
		Title:       req.Title,
		Description: req.Description,
		CreatorID:   userID.(uuid.UUID),
		Status:      domain.StatusBacklog,
	}

	if err := h.db.Create(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative"})
		return
	}

	c.JSON(http.StatusCreated, initiative)
}

// PUT /initiatives/:id
func (h *InitiativeHandler) UpdateInitiative(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var initiative domain.Initiative
	if err := h.db.First(&initiative, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	var req domain.Initiative
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	initiative.Title = req.Title
	initiative.Summary = req.Summary
	initiative.Category = req.Category
	initiative.Vertical = req.Vertical
	initiative.Countries = req.Countries
	initiative.Client = req.Client
	initiative.ClientType = req.ClientType
	initiative.Description = req.Description
	initiative.EconomicImpactType = req.EconomicImpactType
	initiative.EconomicImpactNote = req.EconomicImpactNote
	initiative.ExperienceImpact = req.ExperienceImpact
	initiative.InnovationLevel = req.InnovationLevel
	initiative.TechnicalEstimation = req.TechnicalEstimation
	initiative.SystemicRisk = req.SystemicRisk

	if err := h.db.Save(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update initiative"})
		return
	}

	// Log audit trail
	userID, _ := c.Get("user_id")
	auditLog := domain.AuditLog{
		InitiativeID: initiative.ID,
		UserID:       userID.(uuid.UUID),
		Action:       "update",
		Field:        "initiative",
		NewValue:     "Initiative updated",
	}
	h.db.Create(&auditLog)

	c.JSON(http.StatusOK, initiative)
}

// POST /initiatives/:id/status
func (h *InitiativeHandler) UpdateStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var req struct {
		Status domain.InitiativeStatus `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var initiative domain.Initiative
	if err := h.db.First(&initiative, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	oldStatus := initiative.Status
	initiative.Status = req.Status

	if err := h.db.Save(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// Log audit trail
	userID, _ := c.Get("user_id")
	auditLog := domain.AuditLog{
		InitiativeID: initiative.ID,
		UserID:       userID.(uuid.UUID),
		Action:       "status_change",
		Field:        "status",
		OldValue:     string(oldStatus),
		NewValue:     string(req.Status),
	}
	h.db.Create(&auditLog)

	c.JSON(http.StatusOK, initiative)
}

// DELETE /initiatives/:id
func (h *InitiativeHandler) DeleteInitiative(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.db.Delete(&domain.Initiative{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete initiative"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// POST /initiatives/:id/score
func (h *InitiativeHandler) CalculateScore(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var initiative domain.Initiative
	if err := h.db.First(&initiative, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	// Calculate score using scoring service
	scoreBreakdown, err := h.scoringService.CalculateScore(&initiative)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate score"})
		return
	}

	// Update initiative with score
	initiative.ScoreBreakdown = scoreBreakdown
	if err := h.db.Save(&initiative).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save score"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"initiative":      initiative,
		"score_breakdown": scoreBreakdown,
	})
}

// GET /initiatives/prioritized
func (h *InitiativeHandler) GetPrioritizedInitiatives(c *gin.Context) {
	var initiatives []*domain.Initiative

	// Fetch initiatives with scores
	if err := h.db.Where("score_breakdown IS NOT NULL").Find(&initiatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiatives"})
		return
	}

	// Sort by priority using scoring service (simplified)
	prioritized := initiatives

	c.JSON(http.StatusOK, gin.H{
		"data": prioritized,
	})
}
