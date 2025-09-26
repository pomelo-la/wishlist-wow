package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Initiative states
type InitiativeStatus string

const (
	StatusDraft            InitiativeStatus = "draft"
	StatusLoaded           InitiativeStatus = "loaded"
	StatusInReview         InitiativeStatus = "in_review"
	StatusInEstimation     InitiativeStatus = "in_estimation"
	StatusEvaluationClosed InitiativeStatus = "evaluation_closed"
	StatusPrioritized      InitiativeStatus = "prioritized"
)

// User roles
type UserRole string

const (
	RoleCreator   UserRole = "creator"
	RoleReviewer  UserRole = "reviewer"
	RoleITManager UserRole = "it_manager"
	RoleOwner     UserRole = "owner"
	RoleAdmin     UserRole = "admin"
)

// Categories
type Category string

const (
	CategoryRegulatory  Category = "regulatory"
	CategoryRisk        Category = "risk"
	CategoryPerformance Category = "performance"
	CategoryValueProp   Category = "value_prop"
	CategoryNewProduct  Category = "new_product"
)

// Verticals
type Vertical string

const (
	VerticalBanking    Vertical = "banking"
	VerticalRetail     Vertical = "retail"
	VerticalGovernment Vertical = "government"
	VerticalHealthcare Vertical = "healthcare"
	VerticalEducation  Vertical = "education"
)

// Countries
type Country string

const (
	CountryBrazil    Country = "brazil"
	CountryMexico    Country = "mexico"
	CountryArgentina Country = "argentina"
	CountryColombia  Country = "colombia"
	CountryChile     Country = "chile"
	CountryPeru      Country = "peru"
)

// Client types
type ClientType string

const (
	ClientTopIssuer ClientType = "top_issuer"
	ClientMajor     ClientType = "major"
	ClientMedium    ClientType = "medium"
	ClientSmall     ClientType = "small"
	ClientStartup   ClientType = "startup"
)

// Risk levels
type RiskLevel string

const (
	RiskBlocker RiskLevel = "blocker"
	RiskHigh    RiskLevel = "high"
	RiskMedium  RiskLevel = "medium"
	RiskLow     RiskLevel = "low"
)

// Economic impact types
type EconomicImpactType string

const (
	EconomicImpactSignificant    EconomicImpactType = "significant"
	EconomicImpactModerate       EconomicImpactType = "moderate"
	EconomicImpactLow            EconomicImpactType = "low"
	EconomicImpactHardToQuantify EconomicImpactType = "hard_to_quantify"
)

// Innovation levels
type InnovationLevel string

const (
	InnovationDisruptive  InnovationLevel = "disruptive"
	InnovationIncremental InnovationLevel = "incremental"
	InnovationParity      InnovationLevel = "parity"
)

// Experience impact checklist
type ExperienceImpact struct {
	ImproveOnboarding    bool `json:"improve_onboarding"`
	ReduceFriction       bool `json:"reduce_friction"`
	EnhanceSecurity      bool `json:"enhance_security"`
	ImprovePerformance   bool `json:"improve_performance"`
	AddNewFeatures       bool `json:"add_new_features"`
	ImproveAccessibility bool `json:"improve_accessibility"`
}

// Technical estimation
type TechnicalEstimation struct {
	EffortWeeks     int    `json:"effort_weeks"`
	ConfidenceLevel int    `json:"confidence_level"` // 1-10
	Dependencies    string `json:"dependencies"`
	TechnicalRisks  string `json:"technical_risks"`
}

// Scoring breakdown
type ScoreBreakdown struct {
	CategoryScore   int    `json:"category_score"`
	VerticalScore   int    `json:"vertical_score"`
	ClientScore     int    `json:"client_score"`
	CountryScore    int    `json:"country_score"`
	RiskScore       int    `json:"risk_score"`
	EconomicScore   int    `json:"economic_score"`
	ExperienceScore int    `json:"experience_score"`
	InnovationScore int    `json:"innovation_score"`
	TotalScore      int    `json:"total_score"`
	Explanation     string `json:"explanation"`
}

// Main Initiative model
// Initiative represents a business initiative (using InitiativeV2 structure)
type Initiative struct {
	// TableName specifies the table name for GORM
	// TableName() string { return "initiative_v2" }
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
	ExperienceImpact          string    `json:"experienceImpact" gorm:"type:text"`
	CompetitiveApproach       string    `json:"competitiveApproach" gorm:"type:varchar(200)"`
	ExecutiveSummary          string    `json:"executiveSummary" gorm:"type:text"`
	ROI                       float64   `json:"roi" gorm:"type:decimal(10,2)"`
	UpdatedAt                 time.Time `json:"updatedAt" gorm:"type:timestamp with time zone;default:now()"`
}

// TableName specifies the table name for GORM
func (Initiative) TableName() string {
	return "initiative_v2"
}

// User model
type User struct {
	ID       uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	Email    string    `json:"email" gorm:"unique"`
	Name     string    `json:"name"`
	Role     UserRole  `json:"role"`
	IsActive bool      `json:"is_active"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Message for chat functionality
type Message struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	InitiativeID uuid.UUID `json:"initiative_id"`
	AuthorID     uuid.UUID `json:"author_id"`
	AuthorRole   UserRole  `json:"author_role"`
	Content      string    `json:"content"`
	Tags         []string  `json:"tags" gorm:"type:text[]"`
	CreatedAt    time.Time `json:"created_at"`

	// Relations
	Author     User       `json:"author,omitempty" gorm:"foreignKey:AuthorID"`
	Initiative Initiative `json:"initiative,omitempty" gorm:"foreignKey:InitiativeID"`
}

// Agent suggestions
type Suggestion struct {
	ID             uuid.UUID        `json:"id" gorm:"type:uuid;primary_key"`
	InitiativeID   uuid.UUID        `json:"initiative_id"`
	Field          string           `json:"field"`
	SuggestedValue string           `json:"suggested_value"`
	Rationale      string           `json:"rationale"`
	Confidence     int              `json:"confidence"` // 1-10
	Status         SuggestionStatus `json:"status"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`

	// Relations
	Initiative Initiative `json:"initiative,omitempty" gorm:"foreignKey:InitiativeID"`
}

type SuggestionStatus string

const (
	SuggestionPending  SuggestionStatus = "pending"
	SuggestionApplied  SuggestionStatus = "applied"
	SuggestionRejected SuggestionStatus = "rejected"
)

// Audit log
type AuditLog struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primary_key"`
	InitiativeID uuid.UUID `json:"initiative_id"`
	UserID       uuid.UUID `json:"user_id"`
	Action       string    `json:"action"`
	Field        string    `json:"field"`
	OldValue     string    `json:"old_value"`
	NewValue     string    `json:"new_value"`
	CreatedAt    time.Time `json:"created_at"`

	// Relations
	User       User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Initiative Initiative `json:"initiative,omitempty" gorm:"foreignKey:InitiativeID"`
}

// Before create hooks

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (m *Message) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (s *Suggestion) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
