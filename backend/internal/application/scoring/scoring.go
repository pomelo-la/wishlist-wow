package scoring

import (
	"pomelo-wishlist/internal/domain"
)

type ScoringService struct{}

func NewScoringService() *ScoringService {
	return &ScoringService{}
}

func (s *ScoringService) CalculateScore(initiative *domain.Initiative) (*domain.ScoreBreakdown, error) {
	// For now, return a simple mock score
	breakdown := &domain.ScoreBreakdown{
		TotalScore:  85,
		Explanation: "Mock score calculation",
	}

	return breakdown, nil
}

func (s *ScoringService) calculateCategoryScore(category domain.Category) int {
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

func (s *ScoringService) calculateVerticalScore(category domain.Category, vertical domain.Vertical) int {
	// Only applies to Mandates/Regulatory and Performance categories
	if category != domain.CategoryMandatesRegulatoryRisk && category != domain.CategoryPerformanceImprovement {
		return 0
	}

	switch vertical {
	case domain.VerticalProcessing:
		return 35
	case domain.VerticalCore:
		return 30
	case domain.VerticalBINSponsor:
		return 25
	case domain.VerticalCardManagement:
		return 20
	case domain.VerticalTokenization:
		return 15
	case domain.VerticalFraudTools:
		return 10
	case domain.VerticalPlatformExperience:
		return 5
	default:
		return 0
	}
}

func (s *ScoringService) calculateClientScore(clientType domain.ClientType) int {
	switch clientType {
	case domain.ClientTopIssuer:
		return 40
	case domain.ClientTier1:
		return 30
	case domain.ClientTier2:
		return 20
	case domain.ClientTier3:
		return 10
	default:
		return 0
	}
}

func (s *ScoringService) calculateCountryScore(countries []domain.Country) int {
	// Simple scoring based on number of countries
	return len(countries) * 5
}

func (s *ScoringService) calculateRiskScore(risk domain.RiskLevel) int {
	switch risk {
	case domain.RiskBlocker:
		return 200 // Special flag
	case domain.RiskHigh:
		return 50
	case domain.RiskMedium:
		return 30
	case domain.RiskLow:
		return 10
	case domain.RiskNA:
		return 0
	default:
		return 0
	}
}

func (s *ScoringService) calculateEconomicScore(economicImpact domain.EconomicImpactType) int {
	switch economicImpact {
	case domain.EconomicImpactSignificant:
		return 50
	case domain.EconomicImpactModerate:
		return 30
	case domain.EconomicImpactLow:
		return 10
	default:
		return 0
	}
}

func (s *ScoringService) calculateExperienceScoreFromArray(experienceImpact []string) int {
	// Simple scoring based on number of impact areas
	return len(experienceImpact) * 10
}

func (s *ScoringService) calculateInnovationScore(innovation domain.InnovationLevel) int {
	switch innovation {
	case domain.InnovationDisruptive:
		return 50
	case domain.InnovationIncremental:
		return 30
	case domain.InnovationParity:
		return 10
	default:
		return 0
	}
}
