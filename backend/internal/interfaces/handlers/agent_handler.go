package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pomelo-wishlist/internal/application/agent"
	"pomelo-wishlist/internal/application/scoring"
	"pomelo-wishlist/internal/domain"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AgentHandler struct {
	db             *gorm.DB
	agentService   *agent.AgentService
	scoringService *scoring.ScoringService
}

func NewAgentHandler(db *gorm.DB, agentService *agent.AgentService) *AgentHandler {
	return &AgentHandler{
		db:             db,
		agentService:   agentService,
		scoringService: scoring.NewScoringService(),
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
	_, exists := c.Get("user_id")
	if !exists {
		// For development, create a default user - not needed for this implementation
	}

	// Extract chat conversation content for parsing
	chatContent := h.extractChatContent(req.Context)

	// Create a comprehensive initiative using chat data + defaults from create_test_initiatives
	newInitiative := &domain.Initiative{
		ID:          uuid.New(),
		Title:       h.extractField(req.Context, "title", "Nueva Iniciativa desde Chat"),
		Description: h.extractField(req.Context, "description", chatContent),
		Status:      domain.StatusBacklog,
		CreatedBy:   "chat_user",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),

		// New fields for 9-dimension scoring system
		Quarter:                   "Q1 2024",
		Score:                     0, // Will be calculated later
		Category:                  h.mapCategory(h.extractField(req.Context, "category", "")),
		Vertical:                  h.mapVertical(h.extractField(req.Context, "vertical", "")),
		ClientType:                h.mapClientType(h.extractField(req.Context, "clientType", "")),
		Country:                   h.mapCountry(h.extractField(req.Context, "country", "")),
		SystemicRisk:              h.mapRiskLevel(h.extractField(req.Context, "risk", "")),
		EconomicImpact:            h.mapEconomicImpact(h.extractField(req.Context, "economicImpact", "")),
		EconomicImpactDescription: h.extractField(req.Context, "businessCase", "Generado desde conversación de chat"),
		ExperienceImpact:          h.extractExperienceImpact(req.Context),
		CompetitiveApproach:       h.mapInnovationLevel(h.extractField(req.Context, "innovation", "")),
		ExecutiveSummary:          h.extractField(req.Context, "executiveSummary", chatContent),
		ROI:                       h.extractIntField(req.Context, "roi", 150),
	}

	// Calculate score using scoring service
	if h.scoringService != nil {
		scoreBreakdown, err := h.scoringService.CalculateScore(*newInitiative)
		if err == nil {
			newInitiative.Score = scoreBreakdown.TotalScore
			newInitiative.ScoreBreakdown = scoreBreakdown
		}
	}

	// Create initiative in database using raw SQL to match initiative_v2 table
	result := h.db.Exec(`
		INSERT INTO initiative_v2 (
			id, title, description, status, "createdBy", "createdAt", "updatedAt",
			quarter, score, category, vertical, "clientType", country,
			"systemicRisk", "economicImpact", "economicImpactDescription",
			"experienceImpact", "competitiveApproach", "executiveSummary", roi
		) VALUES (
			?, ?, ?, ?, ?, NOW(), NOW(),
			?, ?, ?, ?, ?, ?,
			?, ?, ?,
			?, ?, ?, ?
		)
	`,
		newInitiative.ID, newInitiative.Title, newInitiative.Description, newInitiative.Status, newInitiative.CreatedBy,
		newInitiative.Quarter, newInitiative.Score, newInitiative.Category, newInitiative.Vertical,
		newInitiative.ClientType, newInitiative.Country, newInitiative.SystemicRisk,
		newInitiative.EconomicImpact, newInitiative.EconomicImpactDescription,
		h.arrayToPostgresArray(newInitiative.ExperienceImpact), newInitiative.CompetitiveApproach,
		newInitiative.ExecutiveSummary, newInitiative.ROI)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create initiative"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Initiative created successfully",
		"initiative": newInitiative,
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

// Helper functions for extracting and mapping chat data

func (h *AgentHandler) extractChatContent(context map[string]interface{}) string {
	if history, ok := context["conversation_history"]; ok {
		if historyArray, ok := history.([]interface{}); ok {
			var content []string
			for _, item := range historyArray {
				if msgMap, ok := item.(map[string]interface{}); ok {
					if user, ok := msgMap["user"].(string); ok {
						content = append(content, user)
					}
				}
			}
			return strings.Join(content, " ")
		}
	}
	return "Contenido generado desde chat de iniciativa"
}

func (h *AgentHandler) extractField(context map[string]interface{}, key, defaultValue string) string {
	if value, ok := context[key]; ok {
		if strValue, ok := value.(string); ok && strValue != "" {
			return strValue
		}
	}
	return defaultValue
}

func (h *AgentHandler) extractIntField(context map[string]interface{}, key string, defaultValue int) int {
	if value, ok := context[key]; ok {
		if intValue, ok := value.(int); ok {
			return intValue
		}
		if strValue, ok := value.(string); ok {
			if intValue, err := strconv.Atoi(strValue); err == nil {
				return intValue
			}
		}
	}
	return defaultValue
}

func (h *AgentHandler) extractExperienceImpact(context map[string]interface{}) []string {
	if impact, ok := context["experienceImpact"]; ok {
		if impactArray, ok := impact.([]interface{}); ok {
			var result []string
			for _, item := range impactArray {
				if strItem, ok := item.(string); ok {
					result = append(result, strItem)
				}
			}
			if len(result) > 0 {
				return result
			}
		}
	}
	// Default experience impact from create_test_initiatives
	return []string{"Contact Rate", "Aprobación"}
}

func (h *AgentHandler) arrayToPostgresArray(arr []string) string {
	if len(arr) == 0 {
		return "ARRAY[]::text[]"
	}
	quotedItems := make([]string, len(arr))
	for i, item := range arr {
		quotedItems[i] = "'" + strings.ReplaceAll(item, "'", "''") + "'"
	}
	return "ARRAY[" + strings.Join(quotedItems, ",") + "]"
}

// Mapping functions to convert chat values to domain constants

func (h *AgentHandler) mapCategory(chatValue string) domain.Category {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "regulatorio") || strings.Contains(chatValue, "mandates") || strings.Contains(chatValue, "riesgo"):
		return domain.CategoryMandatesRegulatoryRisk
	case strings.Contains(chatValue, "performance") || strings.Contains(chatValue, "mejora"):
		return domain.CategoryPerformanceImprovement
	case strings.Contains(chatValue, "value") || strings.Contains(chatValue, "propuesta"):
		return domain.CategoryValueProp
	case strings.Contains(chatValue, "nuevo") || strings.Contains(chatValue, "lanzamiento"):
		return domain.CategoryNewProductLaunch
	default:
		return domain.CategoryValueProp // Default
	}
}

func (h *AgentHandler) mapVertical(chatValue string) domain.Vertical {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "processing"):
		return domain.VerticalProcessing
	case strings.Contains(chatValue, "core"):
		return domain.VerticalCore
	case strings.Contains(chatValue, "bin") || strings.Contains(chatValue, "sponsor"):
		return domain.VerticalBINSponsor
	case strings.Contains(chatValue, "card") || strings.Contains(chatValue, "logistics"):
		return domain.VerticalCardManagement
	case strings.Contains(chatValue, "token"):
		return domain.VerticalTokenization
	case strings.Contains(chatValue, "fraud"):
		return domain.VerticalFraudTools
	case strings.Contains(chatValue, "platform") || strings.Contains(chatValue, "experience"):
		return domain.VerticalPlatformExperience
	default:
		return domain.VerticalCore // Default
	}
}

func (h *AgentHandler) mapClientType(chatValue string) domain.ClientType {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "todos") || strings.Contains(chatValue, "all"):
		return domain.ClientAll
	case strings.Contains(chatValue, "top") || strings.Contains(chatValue, "issuer"):
		return domain.ClientTopIssuer
	case strings.Contains(chatValue, "tier 1") || strings.Contains(chatValue, "tier1"):
		return domain.ClientTier1
	case strings.Contains(chatValue, "tier 2") || strings.Contains(chatValue, "tier2"):
		return domain.ClientTier2
	case strings.Contains(chatValue, "tier 3") || strings.Contains(chatValue, "tier3"):
		return domain.ClientTier3
	default:
		return domain.ClientTier1 // Default
	}
}

func (h *AgentHandler) mapCountry(chatValue string) domain.Country {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "todos") || strings.Contains(chatValue, "all"):
		return domain.CountryAll
	case strings.Contains(chatValue, "argentina"):
		return domain.CountryArgentina
	case strings.Contains(chatValue, "brasil") || strings.Contains(chatValue, "brazil"):
		return domain.CountryBrazil
	case strings.Contains(chatValue, "chile"):
		return domain.CountryChile
	case strings.Contains(chatValue, "colombia"):
		return domain.CountryColombia
	case strings.Contains(chatValue, "mexico"):
		return domain.CountryMexico
	case strings.Contains(chatValue, "rola"):
		return domain.CountryROLA
	default:
		return domain.CountryBrazil // Default to largest market
	}
}

func (h *AgentHandler) mapRiskLevel(chatValue string) domain.RiskLevel {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "bloqueante") || strings.Contains(chatValue, "blocker"):
		return domain.RiskBlocker
	case strings.Contains(chatValue, "alto") || strings.Contains(chatValue, "high"):
		return domain.RiskHigh
	case strings.Contains(chatValue, "medio") || strings.Contains(chatValue, "medium"):
		return domain.RiskMedium
	case strings.Contains(chatValue, "bajo") || strings.Contains(chatValue, "low"):
		return domain.RiskLow
	case strings.Contains(chatValue, "n/a") || strings.Contains(chatValue, "na"):
		return domain.RiskNA
	default:
		return domain.RiskMedium // Default
	}
}

func (h *AgentHandler) mapEconomicImpact(chatValue string) domain.EconomicImpactType {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "significativo") || strings.Contains(chatValue, "significant"):
		return domain.EconomicImpactSignificant
	case strings.Contains(chatValue, "moderado") || strings.Contains(chatValue, "moderate"):
		return domain.EconomicImpactModerate
	case strings.Contains(chatValue, "menor") || strings.Contains(chatValue, "low") || strings.Contains(chatValue, "dificil"):
		return domain.EconomicImpactLow
	default:
		return domain.EconomicImpactModerate // Default
	}
}

func (h *AgentHandler) mapInnovationLevel(chatValue string) domain.InnovationLevel {
	chatValue = strings.ToLower(chatValue)
	switch {
	case strings.Contains(chatValue, "disruptivo") || strings.Contains(chatValue, "disruptive") || strings.Contains(chatValue, "innovador"):
		return domain.InnovationDisruptive
	case strings.Contains(chatValue, "incremental"):
		return domain.InnovationIncremental
	case strings.Contains(chatValue, "paridad") || strings.Contains(chatValue, "parity") || strings.Contains(chatValue, "competencia"):
		return domain.InnovationParity
	default:
		return domain.InnovationIncremental // Default
	}
}
