package domain

import (
	"time"
)

// SimpleInitiative represents a simplified initiative model with text fields only
type SimpleInitiative struct {
	ID               int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Category         string    `json:"category" gorm:"type:varchar(100)"`
	Vertical         string    `json:"vertical" gorm:"type:varchar(100)"`
	ClientType       string    `json:"client_type" gorm:"type:varchar(100)"`
	Country          string    `json:"country" gorm:"type:varchar(100)"`
	SystemicRisk     string    `json:"systemic_risk" gorm:"type:varchar(100)"`
	EconomicImpact   string    `json:"economic_impact" gorm:"type:varchar(100)"`
	ExperienceImpact string    `json:"experience_impact" gorm:"type:varchar(100)"`
	CompetitiveFocus string    `json:"competitive_focus" gorm:"type:varchar(100)"`
	CreatedAt        time.Time `json:"created_at" gorm:"type:timestamp with time zone;default:now()"`
	UpdatedAt        time.Time `json:"updated_at" gorm:"type:timestamp with time zone;default:now()"`
}
