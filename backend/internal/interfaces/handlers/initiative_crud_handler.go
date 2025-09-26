package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type InitiativeCRUDHandler struct {
	db *gorm.DB
}

func NewInitiativeCRUDHandler(db *gorm.DB) *InitiativeCRUDHandler {
	return &InitiativeCRUDHandler{db: db}
}

type CreateInitiativeRequest struct {
	Title                     string   `json:"title" binding:"required"`
	Description               string   `json:"description" binding:"required"`
	Status                    string   `json:"status"`
	CreatedBy                 string   `json:"created_by" binding:"required"`
	Quarter                   string   `json:"quarter"`
	Score                     int      `json:"score"`
	Category                  string   `json:"category"`
	Vertical                  string   `json:"vertical"`
	ClientType                string   `json:"client_type"`
	Country                   string   `json:"country"`
	SystemicRisk              string   `json:"systemic_risk"`
	EconomicImpact            string   `json:"economic_impact"`
	EconomicImpactDescription string   `json:"economic_impact_description"`
	ExperienceImpact          []string `json:"experience_impact"`
	CompetitiveApproach       string   `json:"competitive_approach"`
	ExecutiveSummary          string   `json:"executive_summary"`
	ROI                       int      `json:"roi"`
}

type UpdateInitiativeRequest struct {
	Title                     *string   `json:"title"`
	Description               *string   `json:"description"`
	Status                    *string   `json:"status"`
	Quarter                   *string   `json:"quarter"`
	Score                     *int      `json:"score"`
	Category                  *string   `json:"category"`
	Vertical                  *string   `json:"vertical"`
	ClientType                *string   `json:"client_type"`
	Country                   *string   `json:"country"`
	SystemicRisk              *string   `json:"systemic_risk"`
	EconomicImpact            *string   `json:"economic_impact"`
	EconomicImpactDescription *string   `json:"economic_impact_description"`
	ExperienceImpact          *[]string `json:"experience_impact"`
	CompetitiveApproach       *string   `json:"competitive_approach"`
	ExecutiveSummary          *string   `json:"executive_summary"`
	ROI                       *int      `json:"roi"`
}

type InitiativeResponse struct {
	ID                        string   `json:"id"`
	Title                     string   `json:"title"`
	Description               string   `json:"description"`
	Status                    string   `json:"status"`
	CreatedBy                 string   `json:"created_by"`
	CreatedAt                 string   `json:"created_at"`
	UpdatedAt                 string   `json:"updated_at"`
	Quarter                   string   `json:"quarter"`
	Score                     int      `json:"score"`
	Category                  string   `json:"category"`
	Vertical                  string   `json:"vertical"`
	ClientType                string   `json:"client_type"`
	Country                   string   `json:"country"`
	SystemicRisk              string   `json:"systemic_risk"`
	EconomicImpact            string   `json:"economic_impact"`
	EconomicImpactDescription string   `json:"economic_impact_description"`
	ExperienceImpact          []string `json:"experience_impact"`
	CompetitiveApproach       string   `json:"competitive_approach"`
	ExecutiveSummary          string   `json:"executive_summary"`
	ROI                       int      `json:"roi"`
}

type InitiativeListResponse struct {
	Data       []InitiativeResponse `json:"data"`
	Pagination PaginationResponse   `json:"pagination"`
}

type PaginationResponse struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
	Pages int `json:"pages"`
}

type InitiativeStatsResponse struct {
	TotalInitiatives int             `json:"total_initiatives"`
	CategoryCounts   []CategoryCount `json:"category_counts"`
	VerticalCounts   []VerticalCount `json:"vertical_counts"`
	CountryCounts    []CountryCount  `json:"country_counts"`
	StatusCounts     []StatusCount   `json:"status_counts"`
	AverageScore     float64         `json:"average_score"`
	AverageROI       float64         `json:"average_roi"`
	HighROICount     int             `json:"high_roi_count"`
}

type CategoryCount struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

type VerticalCount struct {
	Vertical string `json:"vertical"`
	Count    int    `json:"count"`
}

type CountryCount struct {
	Country string `json:"country"`
	Count   int    `json:"count"`
}

type StatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

// GetInitiatives - Get all initiatives with pagination and filtering
func (h *InitiativeCRUDHandler) GetInitiatives(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	offset := (page - 1) * limit

	// Build query
	query := h.db.Table("initiatives")

	// Apply filters
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if vertical := c.Query("vertical"); vertical != "" {
		query = query.Where("vertical = ?", vertical)
	}
	if country := c.Query("country"); country != "" {
		query = query.Where("country = ?", country)
	}
	if clientType := c.Query("client_type"); clientType != "" {
		query = query.Where("client_type = ?", clientType)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if quarter := c.Query("quarter"); quarter != "" {
		query = query.Where("quarter = ?", quarter)
	}
	if minScore := c.Query("min_score"); minScore != "" {
		query = query.Where("score >= ?", minScore)
	}
	if maxScore := c.Query("max_score"); maxScore != "" {
		query = query.Where("score <= ?", maxScore)
	}
	if minROI := c.Query("min_roi"); minROI != "" {
		query = query.Where("roi >= ?", minROI)
	}
	if maxROI := c.Query("max_roi"); maxROI != "" {
		query = query.Where("roi <= ?", maxROI)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count initiatives"})
		return
	}

	// Get initiatives
	var initiatives []InitiativeResponse
	if err := query.Select(`
		id, title, description, status, created_by, created_at, updated_at,
		quarter, score, category, vertical, client_type, country,
		systemic_risk, economic_impact, economic_impact_description,
		experience_impact, competitive_approach, executive_summary, roi
	`).Offset(offset).Limit(limit).Find(&initiatives).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiatives"})
		return
	}

	// Calculate pagination
	pages := int((total + int64(limit) - 1) / int64(limit))

	response := InitiativeListResponse{
		Data: initiatives,
		Pagination: PaginationResponse{
			Page:  page,
			Limit: limit,
			Total: int(total),
			Pages: pages,
		},
	}

	c.JSON(http.StatusOK, response)
}

// GetInitiative - Get a specific initiative by ID
func (h *InitiativeCRUDHandler) GetInitiative(c *gin.Context) {
	id := c.Param("id")

	var initiative InitiativeResponse
	if err := h.db.Table("initiatives").Select(`
		id, title, description, status, created_by, created_at, updated_at,
		quarter, score, category, vertical, client_type, country,
		systemic_risk, economic_impact, economic_impact_description,
		experience_impact, competitive_approach, executive_summary, roi
	`).Where("id = ?", id).First(&initiative).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch initiative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": initiative})
}

// CreateInitiative - Create a new initiative
func (h *InitiativeCRUDHandler) CreateInitiative(c *gin.Context) {
	var request CreateInitiativeRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Set defaults
	if request.Status == "" {
		request.Status = "Backlog"
	}
	if request.Quarter == "" {
		request.Quarter = "Q1 2024"
	}
	if request.ExperienceImpact == nil {
		request.ExperienceImpact = []string{}
	}

	// Insert new initiative using raw SQL to handle arrays properly
	var experienceImpactArray string
	if len(request.ExperienceImpact) == 0 {
		experienceImpactArray = "ARRAY[]::text[]"
	} else {
		quotedItems := make([]string, len(request.ExperienceImpact))
		for i, item := range request.ExperienceImpact {
			quotedItems[i] = "'" + strings.ReplaceAll(item, "'", "''") + "'"
		}
		experienceImpactArray = "ARRAY[" + strings.Join(quotedItems, ",") + "]"
	}

	result := h.db.Exec(`
		INSERT INTO initiatives (
			id, title, description, status, created_by, created_at, updated_at,
			quarter, score, category, vertical, client_type, country,
			systemic_risk, economic_impact, economic_impact_description,
			experience_impact, competitive_approach, executive_summary, roi
		) VALUES (
			gen_random_uuid(), ?, ?, ?, ?, NOW(), NOW(),
			?, ?, ?, ?, ?, ?,
			?, ?, ?,
			?, ?, ?, ?
		)
	`,
		request.Title, request.Description, request.Status, request.CreatedBy,
		request.Quarter, request.Score, request.Category, request.Vertical,
		request.ClientType, request.Country, request.SystemicRisk,
		request.EconomicImpact, request.EconomicImpactDescription,
		experienceImpactArray, request.CompetitiveApproach,
		request.ExecutiveSummary, request.ROI)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Initiative created successfully"})
}

// UpdateInitiative - Update an existing initiative
func (h *InitiativeCRUDHandler) UpdateInitiative(c *gin.Context) {
	id := c.Param("id")

	var request UpdateInitiativeRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Check if initiative exists
	var count int64
	if err := h.db.Table("initiatives").Where("id = ?", id).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check initiative"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Build update map
	updates := make(map[string]interface{})
	updates["updated_at"] = "NOW()"

	if request.Title != nil {
		updates["title"] = *request.Title
	}
	if request.Description != nil {
		updates["description"] = *request.Description
	}
	if request.Status != nil {
		updates["status"] = *request.Status
	}
	if request.Quarter != nil {
		updates["quarter"] = *request.Quarter
	}
	if request.Score != nil {
		updates["score"] = *request.Score
	}
	if request.Category != nil {
		updates["category"] = *request.Category
	}
	if request.Vertical != nil {
		updates["vertical"] = *request.Vertical
	}
	if request.ClientType != nil {
		updates["client_type"] = *request.ClientType
	}
	if request.Country != nil {
		updates["country"] = *request.Country
	}
	if request.SystemicRisk != nil {
		updates["systemic_risk"] = *request.SystemicRisk
	}
	if request.EconomicImpact != nil {
		updates["economic_impact"] = *request.EconomicImpact
	}
	if request.EconomicImpactDescription != nil {
		updates["economic_impact_description"] = *request.EconomicImpactDescription
	}
	if request.ExperienceImpact != nil {
		// Handle array update
		var experienceImpactArray string
		if len(*request.ExperienceImpact) == 0 {
			experienceImpactArray = "ARRAY[]::text[]"
		} else {
			quotedItems := make([]string, len(*request.ExperienceImpact))
			for i, item := range *request.ExperienceImpact {
				quotedItems[i] = "'" + strings.ReplaceAll(item, "'", "''") + "'"
			}
			experienceImpactArray = "ARRAY[" + strings.Join(quotedItems, ",") + "]"
		}
		updates["experience_impact"] = experienceImpactArray
	}
	if request.CompetitiveApproach != nil {
		updates["competitive_approach"] = *request.CompetitiveApproach
	}
	if request.ExecutiveSummary != nil {
		updates["executive_summary"] = *request.ExecutiveSummary
	}
	if request.ROI != nil {
		updates["roi"] = *request.ROI
	}

	// Update initiative
	if err := h.db.Table("initiatives").Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update initiative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Initiative updated successfully"})
}

// DeleteInitiative - Delete an initiative
func (h *InitiativeCRUDHandler) DeleteInitiative(c *gin.Context) {
	id := c.Param("id")

	// Check if initiative exists
	var count int64
	if err := h.db.Table("initiatives").Where("id = ?", id).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check initiative"})
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Delete initiative
	if err := h.db.Table("initiatives").Where("id = ?", id).Delete(nil).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete initiative"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Initiative deleted successfully"})
}

// GetInitiativeStats - Get statistics about initiatives
func (h *InitiativeCRUDHandler) GetInitiativeStats(c *gin.Context) {
	var total int64
	if err := h.db.Table("initiatives").Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count initiatives"})
		return
	}

	// Category counts
	var categoryCounts []CategoryCount
	h.db.Table("initiatives").Select("category, COUNT(*) as count").Group("category").Scan(&categoryCounts)

	// Vertical counts
	var verticalCounts []VerticalCount
	h.db.Table("initiatives").Select("vertical, COUNT(*) as count").Group("vertical").Scan(&verticalCounts)

	// Country counts
	var countryCounts []CountryCount
	h.db.Table("initiatives").Select("country, COUNT(*) as count").Group("country").Scan(&countryCounts)

	// Status counts
	var statusCounts []StatusCount
	h.db.Table("initiatives").Select("status, COUNT(*) as count").Group("status").Scan(&statusCounts)

	// Average score
	var avgScore float64
	h.db.Table("initiatives").Select("AVG(score)").Scan(&avgScore)

	// Average ROI
	var avgROI float64
	h.db.Table("initiatives").Select("AVG(roi)").Scan(&avgROI)

	// High ROI count
	var highROICount int64
	h.db.Table("initiatives").Where("roi > 200").Count(&highROICount)

	response := InitiativeStatsResponse{
		TotalInitiatives: int(total),
		CategoryCounts:   categoryCounts,
		VerticalCounts:   verticalCounts,
		CountryCounts:    countryCounts,
		StatusCounts:     statusCounts,
		AverageScore:     avgScore,
		AverageROI:       avgROI,
		HighROICount:     int(highROICount),
	}

	c.JSON(http.StatusOK, response)
}
