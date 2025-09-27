package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Initiative states
type InitiativeStatus string

const (
	StatusBacklog                    InitiativeStatus = "Backlog"
	StatusIniciativasCargadasRevisar InitiativeStatus = "Iniciativas cargadas a revisar"
	StatusIniciativasAEstimar        InitiativeStatus = "Iniciativas a estimar"
	StatusPriorizacionFinal          InitiativeStatus = "Priorizacion final"
	StatusRoadmapDelQ                InitiativeStatus = "Roadmap del Q"
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
	CategoryMandatesRegulatoryRisk Category = "Mandates / Regulatorio / Riesgo"
	CategoryPerformanceImprovement Category = "Mejora de performance"
	CategoryValueProp              Category = "Value Prop"
	CategoryNewProductLaunch       Category = "Lanzamiento nuevo producto"
)

// Verticals
type Vertical string

const (
	VerticalProcessing         Vertical = "Processing"
	VerticalCore               Vertical = "Core"
	VerticalBINSponsor         Vertical = "BIN Sponsor"
	VerticalCardManagement     Vertical = "Card Management & Logistics"
	VerticalTokenization       Vertical = "Tokenización"
	VerticalFraudTools         Vertical = "Fraud Tools"
	VerticalPlatformExperience Vertical = "Platform experience"
)

// Countries
type Country string

const (
	CountryAll       Country = "Todos"
	CountryArgentina Country = "Argentina"
	CountryBrazil    Country = "Brasil"
	CountryChile     Country = "Chile"
	CountryColombia  Country = "Colombia"
	CountryMexico    Country = "Mexico"
	CountryROLA      Country = "ROLA"
)

// Client types
type ClientType string

const (
	ClientAll       ClientType = "Todos"
	ClientTopIssuer ClientType = "Top Issuer"
	ClientTier1     ClientType = "Tier 1"
	ClientTier2     ClientType = "Tier 2"
	ClientTier3     ClientType = "Tier 3"
)

// Risk levels
type RiskLevel string

const (
	RiskBlocker RiskLevel = "Bloqueante"
	RiskHigh    RiskLevel = "Alto"
	RiskMedium  RiskLevel = "Medio"
	RiskLow     RiskLevel = "Bajo"
	RiskNA      RiskLevel = "N/A"
)

// Economic impact types
type EconomicImpactType string

const (
	EconomicImpactSignificant EconomicImpactType = "Aumento significativo en revenue o nueva linea revenue"
	EconomicImpactModerate    EconomicImpactType = "Aumento moderado en revenue existente"
	EconomicImpactLow         EconomicImpactType = "Impacto menor o dificil de cuantificar"
)

// Innovation levels
type InnovationLevel string

const (
	InnovationDisruptive  InnovationLevel = "Disruptivo"
	InnovationIncremental InnovationLevel = "Mejora incremental"
	InnovationParity      InnovationLevel = "Paridad con competencia"
)

// Experience impact options with their scoring values
type ExperienceImpactOption string

const (
	ExperienceContactRate      ExperienceImpactOption = "Contact Rate"        // 20 puntos
	ExperienceApproval         ExperienceImpactOption = "Aprobación"          // 10 puntos
	ExperienceAcceptance       ExperienceImpactOption = "Aceptación"          // 10 puntos
	ExperienceProvisioningRate ExperienceImpactOption = "Provisioning Rate"   // 5 puntos
	ExperienceSLADelivery      ExperienceImpactOption = "SLA de envíos"       // 10 puntos
	ExperienceSLAIncidents     ExperienceImpactOption = "SLA de incidencias"  // 20 puntos
	ExperienceBPSChargebacks   ExperienceImpactOption = "BPS (Chargebacks)"   // 10 puntos
	ExperienceManualKYCReview  ExperienceImpactOption = "Revisión Manual KYC" // 5 puntos
)

// Experience impact scoring values
var ExperienceImpactScores = map[ExperienceImpactOption]int{
	ExperienceContactRate:      20,
	ExperienceApproval:         10,
	ExperienceAcceptance:       10,
	ExperienceProvisioningRate: 5,
	ExperienceSLADelivery:      10,
	ExperienceSLAIncidents:     20,
	ExperienceBPSChargebacks:   10,
	ExperienceManualKYCReview:  5,
}

// Scoring values for all dimensions

// Category scoring values
var CategoryScores = map[Category]int{
	CategoryMandatesRegulatoryRisk: 30,
	CategoryPerformanceImprovement: 30,
	CategoryValueProp:              20,
	CategoryNewProductLaunch:       200,
}

// Vertical scoring values
var VerticalScores = map[Vertical]int{
	VerticalProcessing:         35,
	VerticalCore:               35,
	VerticalBINSponsor:         25,
	VerticalCardManagement:     15,
	VerticalTokenization:       10,
	VerticalFraudTools:         10,
	VerticalPlatformExperience: 10,
}

// Client type scoring values
var ClientTypeScores = map[ClientType]int{
	ClientAll:       25,
	ClientTopIssuer: 50,
	ClientTier1:     25,
	ClientTier2:     15,
	ClientTier3:     5,
}

// Country scoring values
var CountryScores = map[Country]int{
	CountryAll:       25,
	CountryArgentina: 10,
	CountryBrazil:    25,
	CountryChile:     5,
	CountryColombia:  10,
	CountryMexico:    20,
	CountryROLA:      5,
}

// Risk level scoring values
var RiskLevelScores = map[RiskLevel]int{
	RiskBlocker: 200,
	RiskHigh:    30,
	RiskMedium:  15,
	RiskLow:     5,
	RiskNA:      0,
}

// Economic impact scoring values
var EconomicImpactScores = map[EconomicImpactType]int{
	EconomicImpactSignificant: 70,
	EconomicImpactModerate:    30,
	EconomicImpactLow:         0,
}

// Innovation level scoring values
var InnovationLevelScores = map[InnovationLevel]int{
	InnovationDisruptive:  55,
	InnovationIncremental: 35,
	InnovationParity:      10,
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
type Initiative struct {
	ID          uuid.UUID        `json:"id" gorm:"type:uuid;primary_key"`
	Title       string           `json:"title"`
	Description string           `json:"description"`
	Status      InitiativeStatus `json:"status"`
	CreatedBy   string           `json:"created_by"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`

	// New fields for Kanban
	Quarter                   string             `json:"quarter"`
	Score                     int                `json:"score"`
	Category                  Category           `json:"category"`
	Vertical                  Vertical           `json:"vertical"`
	ClientType                ClientType         `json:"client_type"`
	Country                   Country            `json:"country"`
	SystemicRisk              RiskLevel          `json:"systemic_risk"`
	EconomicImpact            EconomicImpactType `json:"economic_impact"`
	EconomicImpactDescription string             `json:"economic_impact_description"`
	ExperienceImpact          []string           `json:"experience_impact" gorm:"type:text[]"`
	CompetitiveApproach       InnovationLevel    `json:"competitive_approach"`
	ExecutiveSummary          string             `json:"executive_summary"`
	ROI                       int                `json:"roi"`

	// Legacy fields (keeping for backward compatibility)
	Summary                string              `json:"summary,omitempty"`
	CreatorID              uuid.UUID           `json:"creator_id,omitempty"`
	Countries              []Country           `json:"countries,omitempty" gorm:"type:text[]"`
	Client                 string              `json:"client,omitempty"`
	DescriptionLegacy      string              `json:"description_legacy,omitempty"`
	EconomicImpactType     EconomicImpactType  `json:"economic_impact_type,omitempty"`
	EconomicImpactNote     string              `json:"economic_impact_note,omitempty"`
	ExperienceImpactLegacy ExperienceImpact    `json:"experience_impact_legacy,omitempty" gorm:"embedded"`
	InnovationLevel        InnovationLevel     `json:"innovation_level,omitempty"`
	TechnicalEstimation    TechnicalEstimation `json:"technical_estimation,omitempty" gorm:"embedded"`
	ScoreBreakdown         *ScoreBreakdown     `json:"score_breakdown,omitempty" gorm:"embedded"`

	// Relations
	Creator     User         `json:"creator,omitempty" gorm:"foreignKey:CreatorID"`
	Messages    []Message    `json:"messages,omitempty"`
	Suggestions []Suggestion `json:"suggestions,omitempty"`
	AuditLogs   []AuditLog   `json:"audit_logs,omitempty"`
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
func (i *Initiative) BeforeCreate(tx *gorm.DB) error {
	if i.ID == uuid.Nil {
		i.ID = uuid.New()
	}
	return nil
}

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
