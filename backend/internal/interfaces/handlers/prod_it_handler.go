package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProdItHandler struct {
	db *gorm.DB
}

func NewProdItHandler(db *gorm.DB) *ProdItHandler {
	return &ProdItHandler{db: db}
}

type ProdItData struct {
	TechSeeds            string `json:"tech_seeds"`
	TechCertainty        string `json:"tech_certainty"`
	TechNotes            string `json:"tech_notes"`
	UxSeeds              string `json:"ux_seeds"`
	UxCertainty          string `json:"ux_certainty"`
	UxCases              string `json:"ux_cases"`
	ProductCases         string `json:"product_cases"`
	ProductProviders     string `json:"product_providers"`
	ProductNotConsidered string `json:"product_not_considered"`
}

type ProdItUpdateRequest struct {
	TechSeeds            *string `json:"tech_seeds"`
	TechCertainty        *string `json:"tech_certainty"`
	TechNotes            *string `json:"tech_notes"`
	UxSeeds              *string `json:"ux_seeds"`
	UxCertainty          *string `json:"ux_certainty"`
	UxCases              *string `json:"ux_cases"`
	ProductCases         *string `json:"product_cases"`
	ProductProviders     *string `json:"product_providers"`
	ProductNotConsidered *string `json:"product_not_considered"`
}

// validateProdItData validates the Prod & IT data
func validateProdItData(data ProdItUpdateRequest) error {
	// Validate tech_seeds
	if data.TechSeeds != nil {
		if val, err := strconv.Atoi(*data.TechSeeds); err != nil || val < 0 {
			return gin.Error{Err: err, Type: gin.ErrorTypePublic, Meta: "tech_seeds debe ser un número entero positivo"}
		}
	}

	// Validate ux_seeds
	if data.UxSeeds != nil {
		if val, err := strconv.Atoi(*data.UxSeeds); err != nil || val < 0 {
			return gin.Error{Err: err, Type: gin.ErrorTypePublic, Meta: "ux_seeds debe ser un número entero positivo"}
		}
	}

	// Validate tech_certainty
	if data.TechCertainty != nil {
		if val, err := strconv.Atoi(*data.TechCertainty); err != nil || val < 0 || val > 100 {
			return gin.Error{Err: err, Type: gin.ErrorTypePublic, Meta: "tech_certainty debe estar entre 0 y 100"}
		}
	}

	// Validate ux_certainty
	if data.UxCertainty != nil {
		if val, err := strconv.Atoi(*data.UxCertainty); err != nil || val < 0 || val > 100 {
			return gin.Error{Err: err, Type: gin.ErrorTypePublic, Meta: "ux_certainty debe estar entre 0 y 100"}
		}
	}

	return nil
}

// GetProdItData - Get Prod & IT data for an initiative
func (h *ProdItHandler) GetProdItData(c *gin.Context) {
	initiativeID := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(initiativeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid initiative ID"})
		return
	}

	// Check if initiative exists
	var exists bool
	if err := h.db.Raw("SELECT EXISTS(SELECT 1 FROM initiatives WHERE id = ?)", initiativeID).Scan(&exists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check initiative existence"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Get Prod & IT data
	var data ProdItData
	if err := h.db.Raw(`
		SELECT 
			COALESCE(tech_seeds, '0') as tech_seeds,
			COALESCE(tech_certainty, '0') as tech_certainty,
			COALESCE(tech_notes, '') as tech_notes,
			COALESCE(ux_seeds, '0') as ux_seeds,
			COALESCE(ux_certainty, '0') as ux_certainty,
			COALESCE(ux_cases, '') as ux_cases,
			COALESCE(product_cases, '') as product_cases,
			COALESCE(product_providers, '') as product_providers,
			COALESCE(product_not_considered, '') as product_not_considered
		FROM initiatives 
		WHERE id = ?
	`, initiativeID).Scan(&data).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch Prod & IT data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    data,
	})
}

// UpdateProdItData - Update Prod & IT data for an initiative
func (h *ProdItHandler) UpdateProdItData(c *gin.Context) {
	initiativeID := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(initiativeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid initiative ID"})
		return
	}

	var request ProdItUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate data
	if err := validateProdItData(request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if initiative exists
	var exists bool
	if err := h.db.Raw("SELECT EXISTS(SELECT 1 FROM initiatives WHERE id = ?)", initiativeID).Scan(&exists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check initiative existence"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Build update query dynamically
	updates := make(map[string]interface{})

	if request.TechSeeds != nil {
		updates["tech_seeds"] = *request.TechSeeds
	}
	if request.TechCertainty != nil {
		updates["tech_certainty"] = *request.TechCertainty
	}
	if request.TechNotes != nil {
		updates["tech_notes"] = *request.TechNotes
	}
	if request.UxSeeds != nil {
		updates["ux_seeds"] = *request.UxSeeds
	}
	if request.UxCertainty != nil {
		updates["ux_certainty"] = *request.UxCertainty
	}
	if request.UxCases != nil {
		updates["ux_cases"] = *request.UxCases
	}
	if request.ProductCases != nil {
		updates["product_cases"] = *request.ProductCases
	}
	if request.ProductProviders != nil {
		updates["product_providers"] = *request.ProductProviders
	}
	if request.ProductNotConsidered != nil {
		updates["product_not_considered"] = *request.ProductNotConsidered
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Update the initiative
	if err := h.db.Model(&struct{}{}).Table("initiatives").Where("id = ?", initiativeID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update Prod & IT data"})
		return
	}

	// Get updated data
	var data ProdItData
	if err := h.db.Raw(`
		SELECT 
			COALESCE(tech_seeds, '0') as tech_seeds,
			COALESCE(tech_certainty, '0') as tech_certainty,
			COALESCE(tech_notes, '') as tech_notes,
			COALESCE(ux_seeds, '0') as ux_seeds,
			COALESCE(ux_certainty, '0') as ux_certainty,
			COALESCE(ux_cases, '') as ux_cases,
			COALESCE(product_cases, '') as product_cases,
			COALESCE(product_providers, '') as product_providers,
			COALESCE(product_not_considered, '') as product_not_considered
		FROM initiatives 
		WHERE id = ?
	`, initiativeID).Scan(&data).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Datos de Prod & IT actualizados correctamente",
		"data":    data,
	})
}

// CreateProdItData - Create/Initialize Prod & IT data for an initiative
func (h *ProdItHandler) CreateProdItData(c *gin.Context) {
	initiativeID := c.Param("id")

	// Validate UUID
	if _, err := uuid.Parse(initiativeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid initiative ID"})
		return
	}

	var request ProdItUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate data
	if err := validateProdItData(request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if initiative exists
	var exists bool
	if err := h.db.Raw("SELECT EXISTS(SELECT 1 FROM initiatives WHERE id = ?)", initiativeID).Scan(&exists).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check initiative existence"})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Initiative not found"})
		return
	}

	// Set default values for fields not provided
	updates := map[string]interface{}{
		"tech_seeds":             "0",
		"tech_certainty":         "0",
		"tech_notes":             "",
		"ux_seeds":               "0",
		"ux_certainty":           "0",
		"ux_cases":               "",
		"product_cases":          "",
		"product_providers":      "",
		"product_not_considered": "",
	}

	// Override with provided values
	if request.TechSeeds != nil {
		updates["tech_seeds"] = *request.TechSeeds
	}
	if request.TechCertainty != nil {
		updates["tech_certainty"] = *request.TechCertainty
	}
	if request.TechNotes != nil {
		updates["tech_notes"] = *request.TechNotes
	}
	if request.UxSeeds != nil {
		updates["ux_seeds"] = *request.UxSeeds
	}
	if request.UxCertainty != nil {
		updates["ux_certainty"] = *request.UxCertainty
	}
	if request.UxCases != nil {
		updates["ux_cases"] = *request.UxCases
	}
	if request.ProductCases != nil {
		updates["product_cases"] = *request.ProductCases
	}
	if request.ProductProviders != nil {
		updates["product_providers"] = *request.ProductProviders
	}
	if request.ProductNotConsidered != nil {
		updates["product_not_considered"] = *request.ProductNotConsidered
	}

	// Update the initiative
	if err := h.db.Model(&struct{}{}).Table("initiatives").Where("id = ?", initiativeID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Prod & IT data"})
		return
	}

	// Get created data
	var data ProdItData
	if err := h.db.Raw(`
		SELECT 
			COALESCE(tech_seeds, '0') as tech_seeds,
			COALESCE(tech_certainty, '0') as tech_certainty,
			COALESCE(tech_notes, '') as tech_notes,
			COALESCE(ux_seeds, '0') as ux_seeds,
			COALESCE(ux_certainty, '0') as ux_certainty,
			COALESCE(ux_cases, '') as ux_cases,
			COALESCE(product_cases, '') as product_cases,
			COALESCE(product_providers, '') as product_providers,
			COALESCE(product_not_considered, '') as product_not_considered
		FROM initiatives 
		WHERE id = ?
	`, initiativeID).Scan(&data).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch created data"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Datos de Prod & IT creados correctamente",
		"data":    data,
	})
}
