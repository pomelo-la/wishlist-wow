package scoring

import (
	"fmt"
	"pomelo-wishlist/internal/domain"
)

type ScoringService struct{}

func NewScoringService() *ScoringService {
	return &ScoringService{}
}

func (s *ScoringService) CalculateScore(initiative domain.Initiative) (*domain.ScoreBreakdown, error) {
	var totalScore int
	var explanation string

	// 1. Category Score
	categoryScore := s.getCategoryScore(initiative.Category)
	totalScore += categoryScore

	// 2. Vertical Score
	verticalScore := s.getVerticalScore(initiative.Vertical)
	totalScore += verticalScore

	// 3. Client Type Score
	clientScore := s.getClientTypeScore(initiative.ClientType)
	totalScore += clientScore

	// 4. Country Score
	countryScore := s.getCountryScore(initiative.Country)
	totalScore += countryScore

	// 5. Systemic Risk Score
	riskScore := s.getSystemicRiskScore(initiative.SystemicRisk)
	totalScore += riskScore

	// 6. Economic Impact Score
	economicScore := s.getEconomicImpactScore(initiative.EconomicImpact)
	totalScore += economicScore

	// 7. Experience Impact Score (sum of all selected items)
	experienceScore := s.getExperienceImpactScore(initiative.ExperienceImpact)
	totalScore += experienceScore

	// 8. Competitive Approach Score
	innovationScore := s.getCompetitiveApproachScore(initiative.CompetitiveApproach)
	totalScore += innovationScore

	// Build explanation
	explanation = s.buildExplanation(categoryScore, verticalScore, clientScore, countryScore, riskScore, economicScore, experienceScore, innovationScore, totalScore)

	breakdown := &domain.ScoreBreakdown{
		CategoryScore:   categoryScore,
		VerticalScore:   verticalScore,
		ClientScore:     clientScore,
		CountryScore:    countryScore,
		RiskScore:       riskScore,
		EconomicScore:   economicScore,
		ExperienceScore: experienceScore,
		InnovationScore: innovationScore,
		TotalScore:      totalScore,
		Explanation:     explanation,
	}

	return breakdown, nil
}

// Category scoring
func (s *ScoringService) getCategoryScore(category domain.Category) int {
	switch category {
	case domain.CategoryMandatesRegulatoryRisk:
		return 30
	case domain.CategoryPerformanceImprovement:
		return 30
	case domain.CategoryValueProp:
		return 20
	case domain.CategoryNewProductLaunch:
		return 200
	default:
		return 0
	}
}

// Vertical scoring
func (s *ScoringService) getVerticalScore(vertical domain.Vertical) int {
	switch vertical {
	case domain.VerticalProcessing:
		return 35
	case domain.VerticalCore:
		return 35
	case domain.VerticalBINSponsor:
		return 25
	case domain.VerticalCardManagement:
		return 15
	case domain.VerticalTokenization:
		return 10
	case domain.VerticalFraudTools:
		return 10
	case domain.VerticalPlatformExperience:
		return 10
	default:
		return 0
	}
}

// Client Type scoring
func (s *ScoringService) getClientTypeScore(clientType domain.ClientType) int {
	switch clientType {
	case domain.ClientAll:
		return 25
	case domain.ClientTopIssuer:
		return 50
	case domain.ClientTier1:
		return 25
	case domain.ClientTier2:
		return 15
	case domain.ClientTier3:
		return 5
	default:
		return 0
	}
}

// Country scoring
func (s *ScoringService) getCountryScore(country domain.Country) int {
	switch country {
	case domain.CountryAll:
		return 25
	case domain.CountryArgentina:
		return 10
	case domain.CountryBrazil:
		return 25
	case domain.CountryChile:
		return 5
	case domain.CountryColombia:
		return 10
	case domain.CountryMexico:
		return 20
	case domain.CountryROLA:
		return 5
	default:
		return 0
	}
}

// Systemic Risk scoring
func (s *ScoringService) getSystemicRiskScore(risk domain.RiskLevel) int {
	switch risk {
	case domain.RiskBlocker:
		return 200
	case domain.RiskHigh:
		return 30
	case domain.RiskMedium:
		return 15
	case domain.RiskLow:
		return 5
	case domain.RiskNA:
		return 0
	default:
		return 0
	}
}

// Economic Impact scoring
func (s *ScoringService) getEconomicImpactScore(impact domain.EconomicImpactType) int {
	switch impact {
	case domain.EconomicImpactSignificant:
		return 70
	case domain.EconomicImpactModerate:
		return 30
	case domain.EconomicImpactLow:
		return 0
	default:
		return 0
	}
}

// Experience Impact scoring (sum of all selected items)
func (s *ScoringService) getExperienceImpactScore(impacts []string) int {
	scoreMap := map[string]int{
		"Contact Rate":        20,
		"Aprobación":          10,
		"Aceptación":          10,
		"Provisioning Rate":   5,
		"SLA de envíos":       10,
		"SLA de incidencias":  20,
		"BPS (Chargebacks)":   10,
		"Revisión Manual KYC": 5,
	}

	total := 0
	for _, impact := range impacts {
		if points, exists := scoreMap[impact]; exists {
			total += points
		}
	}
	return total
}

// Competitive Approach scoring
func (s *ScoringService) getCompetitiveApproachScore(approach domain.InnovationLevel) int {
	switch approach {
	case domain.InnovationDisruptive:
		return 55
	case domain.InnovationIncremental:
		return 35
	case domain.InnovationParity:
		return 10
	default:
		return 0
	}
}

// Build explanation
func (s *ScoringService) buildExplanation(categoryScore, verticalScore, clientScore, countryScore, riskScore, economicScore, experienceScore, innovationScore, totalScore int) string {
	return fmt.Sprintf("Score breakdown: Category(%d) + Vertical(%d) + Client(%d) + Country(%d) + Risk(%d) + Economic(%d) + Experience(%d) + Innovation(%d) = %d",
		categoryScore, verticalScore, clientScore, countryScore, riskScore, economicScore, experienceScore, innovationScore, totalScore)
}
