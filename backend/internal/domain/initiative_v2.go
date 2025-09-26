package domain

import (
	"time"
)

// InitiativeV2 represents the new initiative structure with all required fields
type InitiativeV2 struct {
	ID                        string    `json:"id" gorm:"type:varchar(36);primary_key"`
	Title                     string    `json:"title" gorm:"type:varchar(500);not null"`
	Description               string    `json:"description" gorm:"type:text"`
	Status                    string    `json:"status" gorm:"type:varchar(50);not null"`
	CreatedBy                 string    `json:"createdBy" gorm:"type:varchar(100);not null"`
	CreatedAt                 time.Time `json:"createdAt" gorm:"type:timestamp with time zone;default:now()"`
	Quarter                   string    `json:"quarter" gorm:"type:varchar(20)"`
	Score                     float64   `json:"score" gorm:"type:decimal(5,2)"`
	Category                  string    `json:"category" gorm:"type:varchar(100)"`
	Vertical                  string    `json:"vertical" gorm:"type:varchar(100)"`
	ClientType                string    `json:"clientType" gorm:"type:varchar(100)"`
	Country                   string    `json:"country" gorm:"type:varchar(100)"`
	SystemicRisk              string    `json:"systemicRisk" gorm:"type:varchar(100)"`
	EconomicImpact            string    `json:"economicImpact" gorm:"type:varchar(100)"`
	EconomicImpactDescription string    `json:"economicImpactDescription" gorm:"type:text"`
	ExperienceImpact          string    `json:"experienceImpact" gorm:"type:text"` // JSON array as string
	CompetitiveApproach       string    `json:"competitiveApproach" gorm:"type:varchar(200)"`
	ExecutiveSummary          string    `json:"executiveSummary" gorm:"type:text"`
	ROI                       float64   `json:"roi" gorm:"type:decimal(10,2)"`
	UpdatedAt                 time.Time `json:"updatedAt" gorm:"type:timestamp with time zone;default:now()"`
}
