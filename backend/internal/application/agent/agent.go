package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"pomelo-wishlist/internal/domain"

	"github.com/sashabaranov/go-openai"
)

// Agent interface for different intervention moments
type Agent interface {
	IntakeIntervention(ctx context.Context, req IntakeRequest) (*IntakeResponse, error)
	EstimationIntervention(ctx context.Context, req EstimationRequest) (*EstimationResponse, error)
	ScoringIntervention(ctx context.Context, req ScoringRequest) (*ScoringResponse, error)
}

// AgentService implements the Agent interface
type AgentService struct {
	scoringService ScoringService
	openaiClient   *openai.Client
}

func NewAgentService(scoringService ScoringService) *AgentService {
	// Use Cloudflare AI Gateway with custom HTTP client
	httpClient := &http.Client{
		Transport: &CustomTransport{},
	}

	config := openai.DefaultConfig("dummy-key") // Cloudflare gateway doesn't use this
	config.BaseURL = "https://gateway.ai.cloudflare.com/v1/bec721af5515c5801c5177906b6bc3b9/pomethon_wow/openai/v1"
	config.HTTPClient = httpClient

	client := openai.NewClientWithConfig(config)

	return &AgentService{
		scoringService: scoringService,
		openaiClient:   client,
	}
}

// Custom transport to add Cloudflare headers
type CustomTransport struct{}

func (t *CustomTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("cf-aig-authorization", "Bearer 7axChTS1U9x8hdZ3r4L36ipj6FRjuHDDq4Tifi_w")
	// Remove the OpenAI Authorization header since we use cf-aig-authorization
	req.Header.Del("Authorization")
	return http.DefaultTransport.RoundTrip(req)
}

// Intake intervention types and structures
type IntakeRequest struct {
	UserInput  string                 `json:"user_input"`
	Initiative *domain.Initiative     `json:"initiative,omitempty"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Step       string                 `json:"step"` // "start", "continue", "validate"
}

type IntakeResponse struct {
	Questions           []Question             `json:"questions,omitempty"`
	Suggestions         []domain.Suggestion    `json:"suggestions,omitempty"`
	ExecutiveSummary    string                 `json:"executive_summary,omitempty"`
	ConfirmationSummary string                 `json:"confirmation_summary,omitempty"`
	Options             []ConfirmationOption   `json:"options,omitempty"`
	NextStep            string                 `json:"next_step"`
	IsComplete          bool                   `json:"is_complete"`
	ExtractedData       map[string]interface{} `json:"extracted_data,omitempty"`
	AwaitingConfirmation bool                   `json:"awaiting_confirmation,omitempty"`
}

type Question struct {
	ID       string   `json:"id"`
	Text     string   `json:"text"`
	Type     string   `json:"type"` // "text", "select", "multiselect", "boolean"
	Options  []string `json:"options,omitempty"`
	Required bool     `json:"required"`
}

type ConfirmationOption struct {
	ID          string `json:"id"`
	Text        string `json:"text"`
	Description string `json:"description"`
}

// Estimation intervention types
type EstimationRequest struct {
	Initiative *domain.Initiative     `json:"initiative"`
	UserInput  string                 `json:"user_input"`
	Context    map[string]interface{} `json:"context,omitempty"`
	Step       string                 `json:"step"`
}

type EstimationResponse struct {
	Questions   []Question                  `json:"questions,omitempty"`
	Suggestions []domain.Suggestion         `json:"suggestions,omitempty"`
	Estimation  *domain.TechnicalEstimation `json:"estimation,omitempty"`
	NextStep    string                      `json:"next_step"`
	IsComplete  bool                        `json:"is_complete"`
}

// Scoring intervention types
type ScoringRequest struct {
	Initiative *domain.Initiative `json:"initiative"`
}

type ScoringResponse struct {
	ScoreBreakdown *domain.ScoreBreakdown `json:"score_breakdown"`
	Suggestions    []domain.Suggestion    `json:"suggestions,omitempty"`
}

// Helper method to call OpenAI through Cloudflare Gateway
func (a *AgentService) callOpenAI(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	if a.openaiClient == nil {
		return "Mock response: Client not configured", nil
	}

	resp, err := a.openaiClient.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: "gpt-4.1-nano", // Cloudflare model
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: systemPrompt,
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: userPrompt,
			},
		},
		MaxTokens:   1500,
		Temperature: 0.7,
	})

	if err != nil {
		return "", fmt.Errorf("Cloudflare AI Gateway error: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return resp.Choices[0].Message.Content, nil
}

// Intake intervention implementation
func (a *AgentService) IntakeIntervention(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	switch req.Step {
	case "start":
		return a.startIntake(ctx, req)
	case "continue":
		return a.continueIntake(ctx, req)
	case "validate":
		return a.validateIntake(ctx, req)
	default:
		return nil, fmt.Errorf("unknown intake step: %s", req.Step)
	}
}

func (a *AgentService) startIntake(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	systemPrompt := `Eres un asistente especializado en ayudar a crear iniciativas de negocio. Tu trabajo es generar preguntas inteligentes y contextuales basadas en lo que el usuario quiere crear.

IMPORTANTE: Responde SOLO con JSON válido siguiendo este formato exacto:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta en español",
      "type": "text|select|multiselect|boolean",
      "options": ["opción1", "opción2"],
      "required": true|false
    }
  ],
  "next_step": "continue",
  "is_complete": false
}

Categorías disponibles: regulatory, risk, performance, value_prop, new_product
Países disponibles: brazil, mexico, argentina, colombia, chile, peru
Tipos de cliente: top_issuer, major, medium, small, startup

Genera 2-4 preguntas relevantes y específicas basadas en el contexto del usuario.`

	userPrompt := fmt.Sprintf("El usuario quiere crear una iniciativa: '%s'. Genera las primeras preguntas para entender mejor su propuesta.", req.UserInput)

	response, err := a.callOpenAI(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, fmt.Errorf("error calling OpenAI: %w", err)
	}

	// Parse JSON response
	var intakeResponse IntakeResponse
	if err := json.Unmarshal([]byte(response), &intakeResponse); err != nil {
		// Fallback to hardcoded questions if JSON parsing fails
		return &IntakeResponse{
			Questions: []Question{
				{ID: "problem_description", Text: "¿Cuál es el problema que resuelve esta iniciativa?", Type: "text", Required: true},
				{ID: "category", Text: "¿En qué categoría la clasificarías?", Type: "select", Options: []string{"regulatory", "risk", "performance", "value_prop", "new_product"}, Required: true},
			},
			NextStep:   "continue",
			IsComplete: false,
		}, nil
	}

	return &intakeResponse, nil
}

func (a *AgentService) continueIntake(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	// Contar respuestas totales del usuario (incluyendo la actual)
	questionCount := 1 // La respuesta actual cuenta como 1
	if req.Context != nil {
		if history, ok := req.Context["conversation_history"].([]interface{}); ok {
			questionCount += len(history) // Sumar respuestas previas
		}
	}

	// DEBUG: Log del conteo de preguntas
	fmt.Printf("DEBUG: questionCount = %d\n", questionCount)

	// Solo manejar respuestas de confirmación si estamos en modo confirmación
	// Modo confirmación se detecta por la existencia de "awaiting_confirmation" en el contexto
	userInput := strings.ToLower(strings.TrimSpace(req.UserInput))
	fmt.Printf("DEBUG: userInput = '%s'\n", userInput)

	// Verificar si estamos en modo confirmación
	awaitingConfirmation := false
	if req.Context != nil {
		if val, exists := req.Context["awaiting_confirmation"]; exists {
			awaitingConfirmation = val.(bool)
		}
	}

	fmt.Printf("DEBUG: awaiting_confirmation = %v\n", awaitingConfirmation)

	// Solo verificar respuestas de confirmación si estamos esperándolas
	if awaitingConfirmation && a.isConfirmationResponse(userInput) {
		fmt.Printf("DEBUG: Detectada respuesta de confirmación válida\n")
		return a.handleConfirmationResponse(ctx, req, userInput)
	}

	// Límite ABSOLUTO: máximo 3 respuestas - NO puede ser sobrescrito (cambiado para pruebas rápidas)
	fmt.Printf("DEBUG: Evaluando límite - questionCount = %d\n", questionCount)
	if questionCount >= 3 {
		fmt.Printf("DEBUG: Límite alcanzado, generando confirmación\n")
		return a.generateConfirmationSummary(ctx, req)
	}
	fmt.Printf("DEBUG: Continuando con preguntas\n")

	// Evaluación inteligente SOLO si tenemos menos de 3 preguntas
	// Esto evita que la evaluación inteligente sobrescriba el límite absoluto
	if questionCount < 3 {
		hasEnoughInfo, shouldConfirm := a.evaluateCompleteness(req.Initiative, req.Context, questionCount)
		if hasEnoughInfo || shouldConfirm {
			return a.generateConfirmationSummary(ctx, req)
		}
	}

	systemPrompt := `Eres un Product Manager senior especializado en fintech, trabajando para Pomelo - una empresa líder de infraestructura de pagos en América Latina. Tu trabajo es guiar la creación de iniciativas de negocio tecnológicas con un enfoque experto en el ecosistema fintech.

## CONTEXTO DE NEGOCIO - POMELO
Pomelo es una plataforma de infraestructura de pagos que ofrece:
- Procesamiento de pagos y transacciones
- Emisión y manejo de tarjetas (débito/crédito)
- Tokenización y seguridad de pagos
- APIs para integration con bancos y fintechs
- Soluciones core banking y BIN sponsorship
- Prevención de fraude y gestión de riesgos

## MERCADOS Y CLIENTES
**Países objetivo**: Brasil (25 puntos), México (20 puntos), Argentina (15 puntos), Colombia (12 puntos), Chile (10 puntos), Perú (8 puntos)

**Tipos de Cliente**:
- Top Issuers: Bancos principales con >1M tarjetas
- Major: Bancos tier 1 con 500K-1M tarjetas
- Medium: Bancos tier 2 con 100K-500K tarjetas
- Small: Bancos tier 3 con <100K tarjetas
- Startups: Fintechs emergentes con productos innovadores

## CATEGORÍAS DE INICIATIVAS
1. **Regulatory (Mandatos)**: Compliance, regulaciones, normativas PCI-DSS, LGPD
2. **Risk (Gestión de Riesgo)**: Fraude, lavado de dinero, riesgo operacional, ciberseguridad
3. **Performance (Rendimiento)**: Latencia, throughput, disponibilidad, optimización de APIs
4. **Value Prop (Propuesta de Valor)**: Nuevas features, mejoras UX, diferenciación competitiva
5. **New Product (Nuevo Producto)**: Productos completamente nuevos, expansión de mercado

## VERTICALES TÉCNICOS
- **Processing**: Procesamiento de transacciones, clearing & settlement
- **Core Banking**: Sistemas core, gestión de cuentas, balances
- **BIN Sponsorship**: Emisión de tarjetas, programa management
- **Card Management**: Lifecycle de tarjetas, activación, bloqueos
- **Tokenization**: Tokenización PCI, vault de datos sensibles
- **Fraud Prevention**: Machine learning para detección, reglas de negocio
- **Platform & APIs**: Infraestructura, microservicios, integrations

## METHODOLOGY & SCORING
**Criterios de Scoring**:
- Impacto Económico: Significativo (ingresos >$1M), Moderado ($100K-1M), Bajo (<$100K)
- Nivel de Innovación: Disruptivo (cambia el mercado), Incremental (mejora), Paridad (catch-up)
- Riesgo Sistémico: Blocker (crítico), High (alto), Medium (medio), Low (bajo)
- Esfuerzo: Semanas de desarrollo estimadas
- Confianza: Nivel de certeza en estimaciones (1-10)

## TU ROL COMO EXPERTO
1. **Contexto Experto**: Usa terminología fintech precisa y haz preguntas que demuestren conocimiento profundo del dominio
2. **Priorización Inteligente**: Identifica iniciativas que realmente impactan KPIs de negocio (TPV, take rate, time-to-market, NPS)
3. **Riesgos Técnicos**: Considera complejidad de integración, dependencias regulatorias, impacto en legacy systems
4. **Competitive Landscape**: Reconoce trends del mercado (Open Banking, PIX, instant payments, embedded finance)

## REGLAS DE CONVERSACIÓN
1. Saluda profesionalmente y pregunta sobre el desafío de negocio específico
2. Haz preguntas inteligentes que demuestren expertise fintech
3. Extrae información estructurada automáticamente
4. Considera el contexto regional (ej: PIX en Brasil, CoDi en México)
5. Valida feasibility técnica y regulatory compliance

## EXTRACCIÓN ESTRUCTURADA
Extrae automáticamente:
- title: Título ejecutivo profesional
- summary: Resumen ejecutivo de 1-2 oraciones
- category: regulatory|risk|performance|value_prop|new_product
- vertical: processing|core|bin-sponsor|card-mgmt|tokenization|fraud|platform
- countries: Array con códigos ["brazil","mexico","argentina","colombia","chile","peru"]
- client_type: top_issuer|major|medium|small|startup
- economic_impact_type: significant|moderate|low|hard_to_quantify
- innovation_level: disruptive|incremental|parity
- systemic_risk: blocker|high|medium|low
- problem_description: Descripción técnica del problema
- business_case: Justificación de negocio con métricas
- client_segment: Perfil detallado del cliente objetivo

## FORMATO DE RESPUESTA JSON
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta estratégica en español",
      "type": "text|select|multiselect|boolean",
      "options": ["opción1", "opción2"],
      "required": true|false
    }
  ],
  "extracted_data": {
    "title": "título ejecutivo",
    "summary": "resumen ejecutivo",
    "category": "performance",
    "vertical": "processing",
    "countries": ["brazil"],
    "client_type": "major",
    "economic_impact_type": "significant",
    "innovation_level": "incremental",
    "systemic_risk": "medium",
    "problem_description": "descripción técnica",
    "business_case": "justificación con ROI",
    "client_segment": "perfil del cliente"
  },
  "next_step": "continue",
  "is_complete": false
}

## EJEMPLOS CONTEXTUALIZADOS
- Input: "Necesito reducir la latencia de autorización"
  → Pregunta: "¿Cuál es la latencia actual vs target? ¿Impacta más a transacciones e-commerce o POS?"
  → Extrae: category="performance", vertical="processing"

- Input: "Compliance con nueva regulación brasileña"
  → Pregunta: "¿Se refiere a Resolução BCB, PIX regulations o LGPD? ¿Qué deadline tenemos?"
  → Extrae: category="regulatory", countries=["brazil"]

- Input: "Producto para startups fintech"
  → Pregunta: "¿Qué funcionalidades core necesitan? ¿Emisión, processing o APIs de onboarding?"
  → Extrae: client_type="startup", category="new_product"`

	// Preparar contexto completo incluyendo historial de conversación
	contextInfo := fmt.Sprintf("Input actual del usuario: %s", req.UserInput)
	contextInfo += fmt.Sprintf("\nNúmero de preguntas ya realizadas: %d", questionCount)

	// Incluir TODA la conversación previa
	if req.Context != nil {
		if history, ok := req.Context["conversation_history"].([]interface{}); ok && len(history) > 0 {
			contextInfo += "\n\nHISTORIAL COMPLETO DE LA CONVERSACIÓN:\n"
			for i, entry := range history {
				if entryMap, ok := entry.(map[string]interface{}); ok {
					if user, exists := entryMap["user"]; exists {
						contextInfo += fmt.Sprintf("%d. Usuario: %v\n", i+1, user)
					}
				}
			}
			contextInfo += "\nIMPORTANTE: NO repitas preguntas que ya fueron respondidas en el historial.\n"
		}
	}

	if req.Initiative != nil {
		initiativeJSON, _ := json.Marshal(req.Initiative)
		contextInfo += fmt.Sprintf("\nDatos extraídos de la iniciativa hasta ahora: %s", string(initiativeJSON))
	}
	if req.Context != nil {
		// Solo incluir campos que no sean conversation_history para evitar duplicación
		contextCopy := make(map[string]interface{})
		for k, v := range req.Context {
			if k != "conversation_history" {
				contextCopy[k] = v
			}
		}
		if len(contextCopy) > 0 {
			contextJSON, _ := json.Marshal(contextCopy)
			contextInfo += fmt.Sprintf("\nContexto de negocio recopilado: %s", string(contextJSON))
		}
	}

	response, err := a.callOpenAI(ctx, systemPrompt, contextInfo)
	if err != nil {
		return nil, fmt.Errorf("error calling OpenAI: %w", err)
	}

	// Parse JSON response
	var intakeResponse IntakeResponse
	if err := json.Unmarshal([]byte(response), &intakeResponse); err != nil {
		// Fallback to contextual questions based on user input
		return a.generateContextualFallback(req.UserInput, req.Context), nil
	}

	// Check if the AI response makes sense for the user input
	lowerInput := strings.ToLower(req.UserInput)
	if strings.Contains(lowerInput, "hola") || strings.Contains(lowerInput, "buenos") || strings.Contains(lowerInput, "buenas") {
		// If user said hello but AI asked about countries/categories, use fallback
		if strings.Contains(intakeResponse.Questions[0].Text, "país") || strings.Contains(intakeResponse.Questions[0].Text, "categoría") {
			return a.generateContextualFallback(req.UserInput, req.Context), nil
		}
	}

	return &intakeResponse, nil
}

// shouldCompleteIntake verifica si tenemos suficiente información para completar el intake
func (a *AgentService) shouldCompleteIntake(initiative *domain.Initiative, context map[string]interface{}) bool {
	// Verificar campos obligatorios de la iniciativa
	if initiative == nil {
		return false
	}

	// Campos obligatorios del modelo Initiative
	if initiative.Title == "" || initiative.Summary == "" {
		return false
	}
	if initiative.Category == "" || initiative.Vertical == "" {
		return false
	}
	if len(initiative.Countries) == 0 || initiative.ClientType == "" {
		return false
	}

	// Verificar que tenemos información mínima del contexto
	if context == nil {
		return false
	}

	// Verificar campos críticos del contexto
	requiredContextFields := []string{
		"problem_description",
		"business_case",
		"economic_impact",
		"client_segment",
		"urgency",
	}

	completedFields := 0
	for _, field := range requiredContextFields {
		if value, exists := context[field]; exists {
			if str, ok := value.(string); ok && len(strings.TrimSpace(str)) > 0 {
				completedFields++
			}
		}
	}

	// Requerimos al menos 4 de 5 campos críticos completados
	return completedFields >= 4
}

// evaluateCompleteness evalúa inteligentemente si tenemos suficiente información
func (a *AgentService) evaluateCompleteness(initiative *domain.Initiative, context map[string]interface{}, questionCount int) (bool, bool) {
	// Evaluar calidad de la información recopilada
	hasTitle := initiative != nil && initiative.Title != ""
	hasSummary := initiative != nil && initiative.Summary != ""
	hasCategory := initiative != nil && initiative.Category != ""
	hasVertical := initiative != nil && initiative.Vertical != ""
	hasCountries := initiative != nil && len(initiative.Countries) > 0
	hasClientType := initiative != nil && initiative.ClientType != ""

	// Campos críticos del contexto
	contextFields := 0
	if context != nil {
		criticalFields := []string{"problem_description", "business_case", "economic_impact", "client_segment"}
		for _, field := range criticalFields {
			if value, exists := context[field]; exists {
				if str, ok := value.(string); ok && len(strings.TrimSpace(str)) > 0 {
					contextFields++
				}
			}
		}
	}

	// Criterios de evaluación inteligente
	basicInfoComplete := hasTitle && hasSummary && hasCategory && hasVertical
	businessInfoComplete := hasCountries && hasClientType && contextFields >= 3

	// Después de 2 preguntas, evaluar si vale la pena mostrar resumen
	// Cambiado de 8 a 2 para pruebas rápidas
	if questionCount >= 2 {
		// Si tenemos info básica completa, ofrecer resumen aunque falten detalles
		if basicInfoComplete && contextFields >= 3 {
			return false, true // No completo, pero ofrecer confirmación
		}
	}

	// Si tenemos toda la info esencial, completar
	if basicInfoComplete && businessInfoComplete {
		return true, true // Completo y ofrecer confirmación
	}

	return false, false // Continuar con preguntas
}

// generateConfirmationSummary genera el resumen de confirmación con opciones para el usuario
func (a *AgentService) generateConfirmationSummary(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	// Preparar contexto completo incluyendo historial de conversación
	contextInfo := fmt.Sprintf("Input actual del usuario: %s", req.UserInput)

	// Incluir TODA la conversación previa
	if req.Context != nil {
		if history, ok := req.Context["conversation_history"].([]interface{}); ok && len(history) > 0 {
			contextInfo += "\n\nHISTORIAL COMPLETO DE LA CONVERSACIÓN:\n"
			for i, entry := range history {
				if entryMap, ok := entry.(map[string]interface{}); ok {
					if user, exists := entryMap["user"]; exists {
						contextInfo += fmt.Sprintf("%d. Usuario: %v\n", i+1, user)
					}
				}
			}
		}

		// Incluir contexto adicional
		contextJSON, _ := json.Marshal(req.Context)
		contextInfo += fmt.Sprintf("\nContexto recopilado: %s\n", string(contextJSON))
	}

	if req.Initiative != nil {
		initiativeJSON, _ := json.Marshal(req.Initiative)
		contextInfo += fmt.Sprintf("Datos de iniciativa: %s\n", string(initiativeJSON))
	}

	// Crear prompt específico para generar resumen ejecutivo
	prompt := fmt.Sprintf(`%s

INSTRUCCIONES PARA GENERAR RESUMEN EJECUTIVO:
Basándote en toda la conversación anterior, genera un resumen ejecutivo profesional y completo que incluya:

1. Un resumen de las respuestas específicas del usuario
2. Información extraída y estructurada sobre la iniciativa
3. Un formato de confirmación que muestre claramente lo que entendiste

Debes devolver ÚNICAMENTE un JSON con este formato:
{
  "confirmation_summary": "Resumen ejecutivo detallado en markdown que incluya toda la información de la conversación",
  "extracted_data": {
    "title": "título inferido de la conversación",
    "summary": "resumen técnico de 1-2 oraciones",
    "category": "regulatory|risk|performance|value_prop|new_product",
    "vertical": "processing|core|bin-sponsor|card-mgmt|tokenization|fraud|platform",
    "countries": ["array de países mencionados"],
    "client_type": "tipo de cliente inferido",
    "economic_impact_type": "impacto económico inferido",
    "problem_description": "descripción del problema basada en las respuestas",
    "business_case": "caso de negocio inferido",
    "client_segment": "segmento de cliente inferido"
  },
  "next_step": "confirm",
  "is_complete": true
}

IMPORTANTE: El confirmation_summary debe incluir específicamente las respuestas que dio el usuario, no información genérica.`, contextInfo)

	// Llamar al LLM
	response, err := a.callOpenAI(ctx, prompt, "")
	if err != nil {
		fmt.Printf("Error llamando LLM para generar resumen de confirmación: %v\n", err)
		return nil, fmt.Errorf("failed to generate confirmation summary: %w", err)
	}

	// Parsear respuesta JSON
	var llmResponse struct {
		ConfirmationSummary string                 `json:"confirmation_summary"`
		ExtractedData       map[string]interface{} `json:"extracted_data"`
		NextStep            string                 `json:"next_step"`
		IsComplete          bool                   `json:"is_complete"`
	}

	if err := json.Unmarshal([]byte(response), &llmResponse); err != nil {
		fmt.Printf("Error parseando JSON del resumen de confirmación: %v\n", err)
		return nil, fmt.Errorf("failed to parse LLM response for confirmation summary: %w", err)
	}

	return &IntakeResponse{
		Questions: []Question{
			{
				ID:       "confirmation",
				Text:     llmResponse.ConfirmationSummary + "\n\n**¿Qué desea hacer?**\n✅ **'confirmar'** - Crear la iniciativa\n➕ **'continuar'** - Refinar más detalles\n✏️ **'modificar'** - Cambiar información",
				Type:     "text",
				Required: false,
			},
		},
		ConfirmationSummary: llmResponse.ConfirmationSummary,
		ExtractedData:       llmResponse.ExtractedData,
		NextStep:            llmResponse.NextStep,
		IsComplete:          llmResponse.IsComplete,
		AwaitingConfirmation: true, // Marcar que estamos esperando confirmación
	}, nil
}


// generateContextualFallback genera preguntas contextuales cuando falla el parsing del JSON
func (a *AgentService) generateContextualFallback(userInput string, context map[string]interface{}) *IntakeResponse {
	lowerInput := strings.ToLower(userInput)

	// Si es un saludo, responder de manera amigable
	if strings.Contains(lowerInput, "hola") || strings.Contains(lowerInput, "buenos") || strings.Contains(lowerInput, "buenas") {
		return &IntakeResponse{
			Questions: []Question{
				{ID: "greeting_followup", Text: "¡Hola! Me alegra que quieras crear una nueva iniciativa. ¿Podrías contarme qué problema específico te gustaría resolver?", Type: "text", Required: true},
			},
			NextStep:   "continue",
			IsComplete: false,
		}
	}

	// Si menciona un país específico
	if strings.Contains(lowerInput, "argentina") || strings.Contains(lowerInput, "brasil") || strings.Contains(lowerInput, "méxico") || strings.Contains(lowerInput, "colombia") || strings.Contains(lowerInput, "chile") {
		return &IntakeResponse{
			Questions: []Question{
				{ID: "country_specific", Text: "Perfecto, veo que mencionas un país específico. ¿Podrías contarme más detalles sobre la iniciativa que tienes en mente?", Type: "text", Required: true},
			},
			NextStep:   "continue",
			IsComplete: false,
		}
	}

	// Si menciona un problema o necesidad
	if strings.Contains(lowerInput, "problema") || strings.Contains(lowerInput, "necesito") || strings.Contains(lowerInput, "quiero") || strings.Contains(lowerInput, "mejorar") {
		return &IntakeResponse{
			Questions: []Question{
				{ID: "problem_details", Text: "Entiendo que tienes un problema específico. ¿Podrías darme más detalles sobre cómo esto afecta a tus clientes o usuarios?", Type: "text", Required: true},
			},
			NextStep:   "continue",
			IsComplete: false,
		}
	}

	// Pregunta genérica pero contextual
	return &IntakeResponse{
		Questions: []Question{
			{ID: "general_context", Text: "Interesante. ¿Podrías contarme más sobre esta iniciativa? ¿Qué problema específico estás tratando de resolver?", Type: "text", Required: true},
		},
		NextStep:   "continue",
		IsComplete: false,
	}
}

func (a *AgentService) validateIntake(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	systemPrompt := `Eres el Director de Producto Senior de Pomelo, líder en infraestructura de pagos de LATAM. Tu función es crear resúmenes ejecutivos estratégicos para el comité de priorización de iniciativas.

## CONTEXTO EMPRESARIAL POMELO
Pomelo es la infraestructura de pagos líder en LATAM con:
- Presencia en Brasil, México, Argentina, Colombia, Chile
- Clientes: desde startups fintech hasta bancos Tier 1
- Stack completo: procesamiento, emisión, core banking, BIN sponsorship
- Volúmenes: $10B+ anuales procesados
- Foco en innovación y compliance regulatoria

## TU ROL COMO DIRECTOR DE PRODUCTO
Generas resúmenes ejecutivos que el C-Level y board usan para:
- Tomar decisiones de inversión y priorización
- Asignar recursos de engineering ($2M+ por iniciativa)
- Evaluar impacto competitivo y market timing
- Alinear roadmap con objetivos estratégicos

## FORMATO DE RESUMEN EJECUTIVO
Crea un resumen profesional que incluya:

**🎯 OPORTUNIDAD ESTRATÉGICA**
- Problema específico del ecosistema fintech LATAM
- Gap competitivo vs players como Stone, PagSeguro, Mercado Pago
- Market size y revenue opportunity potencial

**💰 JUSTIFICACIÓN DE NEGOCIO**
- ROI proyectado y timeline de recuperación
- Impacto en métricas clave (TPV, take rate, NPS, churn)
- Requisitos de inversión estimados (engineering, compliance, ops)

**🎯 ALCANCE Y COMPLEJIDAD**
- Verticales técnicos involucrados (core, processing, fraud, etc.)
- Países/regulaciones afectadas (BCB, CNBV, etc.)
- Tipo de clientes beneficiados (tier 1, startups, etc.)

**⚡ URGENCIA Y RIESGOS**
- Timeline crítico (deadlines regulatorios, launches competidores)
- Riesgos técnicos, de compliance o de mercado
- Dependencias con otros equipos/iniciativas

## EJEMPLOS DE TERMINOLOGÍA FINTECH
- TPV (Total Payment Volume), take rate, interchange
- Acquiring, issuing, tokenization, 3DS authentication
- PCI compliance, fraud scoring, risk management
- Open banking, PIX, instant payments, BNPL
- Card-on-file, recurring billing, marketplace facilitation

Redacta en español con terminología técnica precisa y enfoque en business impact cuantificable. El resumen debe mostrar por qué esta iniciativa merece recursos vs otras 50+ en el backlog.`

	// Prepare all collected information
	contextInfo := fmt.Sprintf("Input del usuario: %s", req.UserInput)
	if req.Initiative != nil {
		initiativeJSON, _ := json.Marshal(req.Initiative)
		contextInfo += fmt.Sprintf("\nInformación de la iniciativa: %s", string(initiativeJSON))
	}
	if req.Context != nil {
		contextJSON, _ := json.Marshal(req.Context)
		contextInfo += fmt.Sprintf("\nContexto adicional: %s", string(contextJSON))
	}

	summary, err := a.callOpenAI(ctx, systemPrompt, contextInfo)
	if err != nil {
		fmt.Printf("Error llamando LLM para generar resumen ejecutivo: %v\n", err)
		return nil, fmt.Errorf("failed to generate executive summary: %w", err)
	}

	return &IntakeResponse{
		ExecutiveSummary: summary,
		NextStep:         "complete",
		IsComplete:       true,
	}, nil
}


// Estimation intervention implementation
func (a *AgentService) EstimationIntervention(ctx context.Context, req EstimationRequest) (*EstimationResponse, error) {
	switch req.Step {
	case "start":
		return a.startEstimation(ctx, req)
	case "continue":
		return a.continueEstimation(ctx, req)
	case "validate":
		return a.validateEstimation(ctx, req)
	default:
		return nil, fmt.Errorf("unknown estimation step: %s", req.Step)
	}
}

func (a *AgentService) startEstimation(ctx context.Context, req EstimationRequest) (*EstimationResponse, error) {
	systemPrompt := `Eres un experto técnico que ayuda a estimar el esfuerzo de iniciativas de software/tecnología. Genera preguntas inteligentes para obtener una estimación precisa.

IMPORTANTE: Responde SOLO con JSON válido siguiendo este formato exacto:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta en español",
      "type": "text|select|number",
      "options": ["opción1", "opción2"],
      "required": true|false
    }
  ],
  "next_step": "continue",
  "is_complete": false
}

Niveles de riesgo disponibles: blocker, high, medium, low
Genera preguntas sobre esfuerzo, confianza, dependencias y complejidad técnica.`

	userPrompt := fmt.Sprintf("Iniciativa a estimar: %s\nInput del usuario: %s", req.Initiative.Title, req.UserInput)

	response, err := a.callOpenAI(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, fmt.Errorf("error calling OpenAI: %w", err)
	}

	var estimationResponse EstimationResponse
	if err := json.Unmarshal([]byte(response), &estimationResponse); err != nil {
		// Fallback
		return &EstimationResponse{
			Questions: []Question{
				{ID: "effort_weeks", Text: "¿Cuántas semanas tomará implementar?", Type: "number", Required: true},
				{ID: "confidence_level", Text: "¿Cuál es tu confianza (1-10)?", Type: "number", Required: true},
			},
			NextStep:   "continue",
			IsComplete: false,
		}, nil
	}

	return &estimationResponse, nil
}

func (a *AgentService) continueEstimation(ctx context.Context, req EstimationRequest) (*EstimationResponse, error) {
	systemPrompt := `Genera preguntas de seguimiento para completar la estimación técnica basándote en las respuestas anteriores.

IMPORTANTE: Responde SOLO con JSON válido siguiendo este formato exacto:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta en español",
      "type": "text|select|number",
      "options": ["opción1", "opción2"],
      "required": true|false
    }
  ],
  "next_step": "validate",
  "is_complete": false
}

Niveles de riesgo: blocker, high, medium, low
Enfócate en riesgos técnicos, dependencias y factores que afecten la estimación.`

	contextInfo := fmt.Sprintf("Iniciativa: %s\nInput: %s", req.Initiative.Title, req.UserInput)

	response, err := a.callOpenAI(ctx, systemPrompt, contextInfo)
	if err != nil {
		return nil, fmt.Errorf("error calling OpenAI: %w", err)
	}

	var estimationResponse EstimationResponse
	if err := json.Unmarshal([]byte(response), &estimationResponse); err != nil {
		// Fallback
		return &EstimationResponse{
			Questions: []Question{
				{ID: "technical_risks", Text: "¿Qué riesgos técnicos anticipas?", Type: "text", Required: false},
				{ID: "systemic_risk", Text: "¿Nivel de riesgo sistémico?", Type: "select", Options: []string{"blocker", "high", "medium", "low"}, Required: true},
			},
			NextStep:   "validate",
			IsComplete: false,
		}, nil
	}

	return &estimationResponse, nil
}

func (a *AgentService) validateEstimation(ctx context.Context, req EstimationRequest) (*EstimationResponse, error) {
	systemPrompt := `Basándote en toda la información recopilada, genera un análisis final de la estimación técnica. Proporciona insights sobre la estimación, riesgos identificados y recomendaciones.

Responde en español de forma profesional y estructurada.`

	contextInfo := fmt.Sprintf("Iniciativa: %s\nInput: %s", req.Initiative.Title, req.UserInput)
	if req.Initiative != nil {
		estimationJSON, _ := json.Marshal(req.Initiative.TechnicalEstimation)
		contextInfo += fmt.Sprintf("\nEstimación técnica: %s", string(estimationJSON))
	}

	_, err := a.callOpenAI(ctx, systemPrompt, contextInfo)
	if err != nil {
		// Log error but continue with the response
		fmt.Printf("OpenAI call failed for validation: %v\n", err)
	}

	return &EstimationResponse{
		Estimation: &req.Initiative.TechnicalEstimation,
		NextStep:   "complete",
		IsComplete: true,
	}, nil
}

// Scoring intervention implementation
func (a *AgentService) ScoringIntervention(ctx context.Context, req ScoringRequest) (*ScoringResponse, error) {
	scoreBreakdown, err := a.scoringService.CalculateScore(req.Initiative)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate score: %w", err)
	}

	return &ScoringResponse{
		ScoreBreakdown: scoreBreakdown,
	}, nil
}

// isConfirmationResponse verifica si el input del usuario es una respuesta a las opciones de confirmación
func (a *AgentService) isConfirmationResponse(userInput string) bool {
	// Detectar respuestas de confirmación comunes - SOLO palabras completas o contextos específicos
	lowerInput := strings.ToLower(strings.TrimSpace(userInput))

	// Patrones exactos de confirmación
	exactConfirmations := []string{
		"confirm", "confirmar", "si", "sí", "yes", "crear", "finalizar",
		"continuar", "refinar", "seguir", "modificar", "cambiar", "editar", "corregir",
		"✅", "➕", "✏️",
	}

	// Buscar palabras exactas (no como substring)
	words := strings.Fields(lowerInput)
	for _, word := range words {
		for _, action := range exactConfirmations {
			if word == action {
				return true
			}
		}
	}

	// Frases específicas de confirmación
	confirmPhrases := []string{
		"crear la iniciativa", "confirmar y crear", "quiero crear",
		"continuar con más preguntas", "seguir preguntando", "más detalles",
		"modificar algo", "cambiar información", "editar datos",
	}

	for _, phrase := range confirmPhrases {
		if strings.Contains(lowerInput, phrase) {
			return true
		}
	}

	return false
}

// handleConfirmationResponse maneja las respuestas del usuario a las opciones de confirmación
func (a *AgentService) handleConfirmationResponse(ctx context.Context, req IntakeRequest, userInput string) (*IntakeResponse, error) {
	// Detectar el tipo de acción seleccionada
	if strings.Contains(userInput, "confirm") || strings.Contains(userInput, "confirmar") ||
		strings.Contains(userInput, "crear") || strings.Contains(userInput, "finalizar") ||
		strings.Contains(userInput, "✅") || strings.Contains(userInput, "si") || strings.Contains(userInput, "sí") {
		// Usuario quiere confirmar y crear la iniciativa
		return &IntakeResponse{
			NextStep:   "validate",
			IsComplete: false, // Ir a validación final
		}, nil
	}

	if strings.Contains(userInput, "continue") || strings.Contains(userInput, "continuar") ||
		strings.Contains(userInput, "refinar") || strings.Contains(userInput, "más") ||
		strings.Contains(userInput, "➕") || strings.Contains(userInput, "seguir") {
		// Usuario quiere continuar refinando
		return &IntakeResponse{
			Questions: []Question{
				{
					ID:       "continue_refinement",
					Text:     "¿Qué aspecto específico te gustaría refinar o agregar más detalles?",
					Type:     "text",
					Required: true,
				},
			},
			NextStep:   "continue",
			IsComplete: false,
		}, nil
	}

	if strings.Contains(userInput, "modify") || strings.Contains(userInput, "modificar") ||
		strings.Contains(userInput, "cambiar") || strings.Contains(userInput, "editar") ||
		strings.Contains(userInput, "corregir") || strings.Contains(userInput, "✏️") {
		// Usuario quiere modificar algo
		return &IntakeResponse{
			Questions: []Question{
				{
					ID:       "modification_field",
					Text:     "¿Qué información específica te gustaría modificar? (título, categoría, descripción, etc.)",
					Type:     "text",
					Required: true,
				},
			},
			NextStep:   "continue",
			IsComplete: false,
		}, nil
	}

	// Si no podemos detectar la acción específica, preguntar por clarificación
	return &IntakeResponse{
		Questions: []Question{
			{
				ID:       "clarify_action",
				Text:     "No estoy seguro de qué acción quieres realizar. ¿Podrías especificar si quieres: 1) Confirmar y crear la iniciativa, 2) Continuar agregando detalles, o 3) Modificar algo específico?",
				Type:     "text",
				Required: true,
			},
		},
		NextStep:   "continue",
		IsComplete: false,
	}, nil
}

// ScoringService interface
type ScoringService interface {
	CalculateScore(initiative *domain.Initiative) (*domain.ScoreBreakdown, error)
}
