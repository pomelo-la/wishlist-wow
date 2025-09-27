package agent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"pomelo-wishlist/internal/domain"

	"github.com/joho/godotenv"
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
	// Load environment variables from config.env
	if err := godotenv.Load("config.env"); err != nil {
		fmt.Printf("Warning: Could not load config.env file: %v\n", err)
	}

	// Get configuration from environment variables
	gatewayToken := os.Getenv("CLOUDFLARE_AI_GATEWAY_TOKEN")
	gatewayURL := os.Getenv("CLOUDFLARE_AI_GATEWAY_URL")

	fmt.Printf("DEBUG: CLOUDFLARE_AI_GATEWAY_TOKEN loaded: %s\n", gatewayToken)
	fmt.Printf("DEBUG: CLOUDFLARE_AI_GATEWAY_URL loaded: %s\n", gatewayURL)

	if gatewayToken == "" || gatewayURL == "" || gatewayToken == "tu_token_aqui" || strings.Contains(gatewayURL, "tu_account_id") {
		fmt.Printf("WARNING: Cloudflare AI Gateway not configured, using mock responses\n")
		return &AgentService{
			scoringService: scoringService,
			openaiClient:   nil, // Will use mock responses
		}
	}

	// Use Cloudflare AI Gateway with custom HTTP client
	httpClient := &http.Client{
		Transport: &CustomTransport{token: gatewayToken},
	}

	config := openai.DefaultConfig("dummy-key") // Cloudflare gateway doesn't use this
	config.BaseURL = gatewayURL
	config.HTTPClient = httpClient

	client := openai.NewClientWithConfig(config)

	return &AgentService{
		scoringService: scoringService,
		openaiClient:   client,
	}
}

// Custom transport to add Cloudflare headers
type CustomTransport struct {
	token string
}

func (t *CustomTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Set("cf-aig-authorization", "Bearer "+t.token)
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
	Questions            []Question             `json:"questions,omitempty"`
	Suggestions          []domain.Suggestion    `json:"suggestions,omitempty"`
	ExecutiveSummary     string                 `json:"executive_summary,omitempty"`
	ConfirmationSummary  string                 `json:"confirmation_summary,omitempty"`
	Options              []ConfirmationOption   `json:"options,omitempty"`
	NextStep             string                 `json:"next_step"`
	IsComplete           bool                   `json:"is_complete"`
	HasSufficientInfo    bool                   `json:"has_sufficient_info,omitempty"`
	ExtractedData        map[string]interface{} `json:"extracted_data,omitempty"`
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
	// If no OpenAI client is configured, return mock responses
	if a.openaiClient == nil {
		return a.getMockIntakeResponse(req.Step), nil
	}

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

INSTRUCCIONES CRITICAS:
- Debes responder UNICAMENTE con un JSON valido
- NO incluyas texto adicional, explicaciones, saludos, o comentarios
- NO uses caracteres especiales como ¡, ¿, o acentos en el JSON
- El JSON debe empezar con { y terminar con }
- Usa solo caracteres ASCII en el JSON
- NO agregues texto antes o despues del JSON

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta en español sin acentos ni caracteres especiales",
      "type": "text|select|multiselect|boolean",
      "options": ["opcion1", "opcion2"],
      "required": true|false
    }
  ],
  "next_step": "continue",
  "is_complete": false
}

Categorias disponibles: regulatory, risk, performance, value_prop, new_product
Paises disponibles: brazil, mexico, argentina, colombia, chile, peru
Tipos de cliente: top_issuer, major, medium, small, startup

Genera 2-4 preguntas relevantes y especificas basadas en el contexto del usuario.

RECUERDA: Responde SOLO con el JSON, sin texto adicional.`

	userPrompt := fmt.Sprintf("El usuario quiere crear una iniciativa: '%s'. Genera las primeras preguntas para entender mejor su propuesta.", req.UserInput)

	response, err := a.callOpenAI(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, fmt.Errorf("error calling OpenAI: %w", err)
	}

	// Parse JSON response
	var intakeResponse IntakeResponse
	if err := json.Unmarshal([]byte(response), &intakeResponse); err != nil {
		return nil, fmt.Errorf("error parsing OpenAI response: %w", err)
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

	// PRIMERO: Verificar si tenemos suficiente información con un prompt específico de suficiencia
	hasSufficientInfo, err := a.checkSufficiency(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("error checking sufficiency: %w", err)
	}

	if hasSufficientInfo {
		fmt.Printf("DEBUG: Prompt de suficiencia determinó que hay información suficiente, generando confirmación\n")
		return a.generateConfirmationSummary(ctx, req)
	}

	// SEGUNDO: Si no hay suficiente información, generar nuevas preguntas

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
1. **ASUME CONTEXTO FINTECH**: No preguntes sobre industria/sector - siempre es fintech/pagos
2. **SALUDO PROFESIONAL**: Saluda como experto en pagos y pregunta sobre el desafío específico
3. **PREGUNTAS INTELIGENTES**: Haz preguntas que demuestren expertise fintech profundo
4. **EXTRACCIÓN AUTOMÁTICA**: Extrae información estructurada automáticamente
5. **CONTEXTO REGIONAL**: Considera regulaciones locales (PIX en Brasil, CoDi en México, etc.)
6. **VALIDACIÓN TÉCNICA**: Valida feasibility técnica y regulatory compliance

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
IMPORTANTE: Debes devolver ÚNICAMENTE un JSON válido, sin texto adicional antes o después.

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
  "next_step": "continue|confirm",
  "is_complete": false,
  "has_sufficient_info": false
}

## INSTRUCCIONES PARA GENERAR PREGUNTAS
Tu única función es generar preguntas inteligentes para recopilar información. NO debes decidir si la información es suficiente.

**CAMPOS QUE DEBES RECOPILAR:**
1. **title**: Título claro de la iniciativa
2. **summary**: Resumen ejecutivo de 1-2 oraciones
3. **category**: regulatory|risk|performance|value_prop|new_product
4. **vertical**: processing|core|bin-sponsor|card-mgmt|tokenization|fraud|platform
5. **countries**: Array con al menos un país ["brazil","mexico","argentina","colombia","chile","peru"]
6. **clientType**: top_issuer|major|medium|small|startup
7. **problem_description**: Descripción técnica del problema a resolver
8. **business_case**: Justificación de negocio con métricas/ROI
9. **economic_impact**: significant|moderate|low|hard_to_quantify
10. **client_segment**: Perfil detallado del cliente objetivo

**INSTRUCCIONES:**
1. **Genera preguntas inteligentes** basadas en la información faltante
2. **Orientá tus preguntas** para recopilar los campos que no tienes
3. **Prioriza campos críticos**: category, vertical, clientType, countries
4. **SIEMPRE** devuelve "has_sufficient_info": false - NO decidas suficiencia
5. **SIEMPRE** devuelve "next_step": "continue" - NO decidas cuándo confirmar

**EJEMPLO DE PREGUNTAS:**
- Usuario dice: "Quiero mejorar el procesamiento de pagos en Brasil"
- Tienes: countries=["brazil"], vertical="processing" (inferido)
- Faltan: title, summary, category, clientType, problem_description, business_case, economic_impact, client_segment
- Próxima pregunta: "¿Cuál es la categoría principal? ¿Es un tema de rendimiento, regulación, o propuesta de valor?"

**IMPORTANTE:**
- NUNCA decidas suficiencia - solo genera preguntas
- SIEMPRE devuelve "has_sufficient_info": false
- SIEMPRE devuelve "next_step": "continue"
- La decisión de suficiencia la toma otro sistema

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
	// Incluir TODA la conversación previa para evitar preguntas repetidas
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

		// Incluir otros campos de contexto
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

	// Debug: print the raw response
	fmt.Printf("DEBUG: Raw LLM response: %s\n", response)

	// Parse JSON response
	var intakeResponse IntakeResponse
	if err := json.Unmarshal([]byte(response), &intakeResponse); err != nil {
		fmt.Printf("DEBUG: JSON parsing error: %v\n", err)
		fmt.Printf("DEBUG: Response bytes: %v\n", []byte(response))
		return nil, fmt.Errorf("error parsing OpenAI response: %w", err)
	}

	// Ya verificamos suficiencia antes, así que solo devolvemos la respuesta
	return &intakeResponse, nil
}

// checkSufficiency verifica si tenemos suficiente información usando un prompt específico
func (a *AgentService) checkSufficiency(ctx context.Context, req IntakeRequest) (bool, error) {
	// Preparar contexto completo de la conversación
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
	}

	// Incluir datos extraídos hasta ahora
	if req.Initiative != nil {
		initiativeJSON, _ := json.Marshal(req.Initiative)
		contextInfo += fmt.Sprintf("\nDatos extraídos de la iniciativa hasta ahora: %s", string(initiativeJSON))
	}

	// Prompt específico para verificar suficiencia
	sufficiencyPrompt := `Eres un analista experto que determina si tenemos suficiente información para crear una iniciativa de negocio fintech.

Tu única tarea es analizar la conversación completa y determinar si tenemos TODOS los campos obligatorios.

CAMPOS OBLIGATORIOS QUE DEBES VERIFICAR:
1. **title**: Título claro de la iniciativa
2. **summary**: Resumen ejecutivo de 1-2 oraciones
3. **category**: regulatory|risk|performance|value_prop|new_product
4. **vertical**: processing|core|bin-sponsor|card-mgmt|tokenization|fraud|platform
5. **countries**: Array con al menos un país ["brazil","mexico","argentina","colombia","chile","peru"]
6. **clientType**: top_issuer|major|medium|small|startup
7. **problem_description**: Descripción técnica del problema a resolver
8. **business_case**: Justificación de negocio con métricas/ROI
9. **economic_impact**: significant|moderate|low|hard_to_quantify
10. **client_segment**: Perfil detallado del cliente objetivo

REGLAS ESTRICTAS DE VALIDACIÓN:
- **countries**: DEBE mencionar al menos un país específico (brasil, mexico, argentina, colombia, chile, peru). Si no se menciona ningún país, el campo está INCOMPLETO.
- **category**: DEBE especificar exactamente uno de: regulatory, risk, performance, value_prop, new_product
- **vertical**: DEBE especificar exactamente uno de: processing, core, bin-sponsor, card-mgmt, tokenization, fraud, platform
- **clientType**: DEBE especificar exactamente uno de: top_issuer, major, medium, small, startup
- **economic_impact**: DEBE especificar exactamente uno de: significant, moderate, low, hard_to_quantify
- **title**: DEBE ser un título específico, no genérico
- **summary**: DEBE ser un resumen concreto de 1-2 oraciones
- **problem_description**: DEBE describir el problema técnico específico
- **business_case**: DEBE incluir justificación de negocio con métricas/ROI
- **client_segment**: DEBE describir el perfil específico del cliente

INSTRUCCIONES:
- Analiza TODA la conversación proporcionada
- Identifica qué información se ha mencionado explícitamente
- NO infieras información que no fue mencionada
- Si falta CUALQUIERA de los 10 campos, la respuesta es "insufficient"
- Solo si tienes TODOS los 10 campos, la respuesta es "sufficient"
- Para "countries": Si no se menciona explícitamente al menos un país, marca como FALTANTE
- Sé estricto: es mejor marcar como insuficiente que aceptar información incompleta

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con un JSON válido:
{
  "sufficient": true|false,
  "missing_fields": ["lista", "de", "campos", "faltantes"],
  "reasoning": "explicación breve de por qué es suficiente o insuficiente"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.`

	response, err := a.callOpenAI(ctx, sufficiencyPrompt, contextInfo)
	if err != nil {
		return false, fmt.Errorf("error calling OpenAI for sufficiency check: %w", err)
	}

	// Parse JSON response
	var sufficiencyResponse struct {
		Sufficient    bool     `json:"sufficient"`
		MissingFields []string `json:"missing_fields"`
		Reasoning     string   `json:"reasoning"`
	}

	if err := json.Unmarshal([]byte(response), &sufficiencyResponse); err != nil {
		fmt.Printf("DEBUG: Sufficiency JSON parsing error: %v\n", err)
		fmt.Printf("DEBUG: Sufficiency response: %s\n", response)
		return false, fmt.Errorf("error parsing sufficiency response: %w", err)
	}

	fmt.Printf("DEBUG: Sufficiency check result: %v\n", sufficiencyResponse.Sufficient)
	fmt.Printf("DEBUG: Missing fields: %v\n", sufficiencyResponse.MissingFields)
	fmt.Printf("DEBUG: Reasoning: %s\n", sufficiencyResponse.Reasoning)

	return sufficiencyResponse.Sufficient, nil
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
// Función eliminada - ahora el LLM decide cuándo tiene suficiente información

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

	// Crear prompt para confirmación con estructura específica
	prompt := `Eres un asistente que extrae y confirma información de iniciativas fintech. 

REGLAS ESTRICTAS:
- SOLO usa información explícitamente proporcionada por el usuario
- NO inventes números, fechas, porcentajes, métricas, o plazos
- NO agregues información de mercado, competidores, o contexto externo
- Si no tienes información para un campo, déjalo vacío o usa "unknown"
- Mantén la estructura del JSON exactamente como se especifica

Debes devolver ÚNICAMENTE un JSON con este formato:
{
  "confirmation_summary": "Resumen ejecutivo estructurado con secciones OBJETIVO, ALCANCE, ENFOQUE y BENEFICIOS ESPERADOS, basado únicamente en la información proporcionada por el usuario",
  "extracted_data": {
    "title": "título basado solo en lo mencionado por el usuario",
    "summary": "resumen de 1-2 oraciones basado solo en lo mencionado",
    "category": "regulatory|risk|performance|value_prop|new_product (solo si fue mencionado, sino 'unknown')",
    "vertical": "processing|banking|issuing|acquiring|fraud|compliance (solo si fue mencionado, sino 'unknown')",
    "countries": ["lista de países mencionados, vacío si no se mencionó ninguno"],
    "client_type": "tipo de cliente mencionado, vacío si no se especificó",
    "economic_impact_type": "tipo de impacto económico mencionado, vacío si no se especificó",
    "problem_description": "descripción del problema tal como la mencionó el usuario",
    "business_case": "justificación de negocio tal como la explicó el usuario",
    "client_segment": "segmento de cliente mencionado, vacío si no se especificó"
  },
  "next_step": "confirm",
  "is_complete": true
}

INSTRUCCIONES PARA EL RESUMEN:
- Crea un resumen ejecutivo estructurado con las siguientes secciones:
  * **OBJETIVO**: ¿Qué se quiere lograr?
  * **ALCANCE**: ¿Dónde y para quién?
  * **ENFOQUE**: ¿Cómo se abordará?
  * **BENEFICIOS ESPERADOS**: ¿Qué se espera conseguir?
- Usa un lenguaje profesional y ejecutivo
- Estructura la información de manera lógica y clara
- NO agregues información que no fue proporcionada
- Mantén un tono profesional pero conservador
- Si falta información en alguna sección, omítela o usa "Por definir"
- EJEMPLO de estructura esperada:
  **OBJETIVO**
  [Descripción del objetivo basado en lo mencionado]
  
  **ALCANCE**
  [Países, clientes, segmentos mencionados]
  
  **ENFOQUE**
  [Método o enfoque mencionado]
  
  **BENEFICIOS ESPERADOS**
  [Beneficios mencionados o inferidos lógicamente]

OBLIGATORIO: 
- SIEMPRE termina el resumen con la pregunta: "¿Te parece correcto este contenido? Responde 'sí' para confirmar o 'no' para modificar."
- Usa "unknown" para campos categóricos no mencionados
- Usa arrays vacíos [] para listas no mencionadas  
- Usa strings vacíos "" para campos de texto no mencionados
- NO infieras información basándote en el contexto`

	// Llamar al LLM
	response, err := a.callOpenAI(ctx, prompt, contextInfo)
	if err != nil {
		fmt.Printf("Error llamando LLM para generar resumen de confirmación: %v\n", err)
		return nil, fmt.Errorf("failed to generate confirmation summary: %w", err)
	}

	// Debug: imprimir la respuesta del LLM
	fmt.Printf("DEBUG: Respuesta del LLM para confirmación: %s\n", response)

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

	// Asegurar que el resumen termine con la pregunta de confirmación
	confirmationText := llmResponse.ConfirmationSummary
	if !strings.Contains(confirmationText, "¿Te parece correcto este contenido?") {
		confirmationText += "\n\n¿Te parece correcto este contenido? Responde 'sí' para confirmar o 'no' para modificar."
	}

	return &IntakeResponse{
		Questions: []Question{
			{
				ID:       "confirmation",
				Text:     confirmationText,
				Type:     "text",
				Required: false,
			},
		},
		ConfirmationSummary:  confirmationText,
		ExtractedData:        llmResponse.ExtractedData,
		NextStep:             llmResponse.NextStep,
		IsComplete:           llmResponse.IsComplete,
		AwaitingConfirmation: true, // Marcar que estamos esperando confirmación
	}, nil
}

func (a *AgentService) validateIntake(ctx context.Context, req IntakeRequest) (*IntakeResponse, error) {
	// Para el botón "Testear Iniciativa", usar el mismo prompt de generateConfirmationSummary
	fmt.Printf("DEBUG: validateIntake called with step: %s\n", req.Step)
	fmt.Printf("DEBUG: validateIntake calling generateConfirmationSummary\n")
	return a.generateConfirmationSummary(ctx, req)
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
		return nil, fmt.Errorf("error parsing OpenAI response: %w", err)
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
		return nil, fmt.Errorf("error parsing OpenAI response: %w", err)
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
	scoreBreakdown, err := a.scoringService.CalculateScore(*req.Initiative)
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
			Questions: []Question{
				{
					ID:       "initiative_confirmed",
					Text:     "✅ **Iniciativa confirmada**\n\nLa iniciativa ha sido creada exitosamente. ¿Deseas crear otra iniciativa o realizar alguna otra acción?",
					Type:     "text",
					Required: false,
				},
			},
			NextStep:   "complete",
			IsComplete: true,
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

// Mock response for when AI Gateway is not configured
func (a *AgentService) getMockIntakeResponse(step string) *IntakeResponse {
	switch step {
	case "start":
		return &IntakeResponse{
			Questions: []Question{
				{
					ID:       "title",
					Text:     "¿Cuál es el título de tu iniciativa?",
					Type:     "text",
					Required: true,
				},
				{
					ID:       "summary",
					Text:     "Describe brevemente de qué se trata la iniciativa",
					Type:     "text",
					Required: true,
				},
			},
			NextStep:   "continue",
			IsComplete: false,
		}
	case "continue":
		return &IntakeResponse{
			Questions: []Question{
				{
					ID:       "category",
					Text:     "¿Qué categoría describe mejor tu iniciativa?",
					Type:     "select",
					Options:  []string{"mandates", "performance", "value-prop", "new-product"},
					Required: true,
				},
			},
			NextStep:   "continue",
			IsComplete: false,
		}
	case "validate":
		return &IntakeResponse{
			ConfirmationSummary: "Resumen de la iniciativa creada (Mock)",
			NextStep:            "complete",
			IsComplete:          true,
		}
	default:
		return &IntakeResponse{
			NextStep:   "continue",
			IsComplete: false,
		}
	}
}

// ScoringService interface
type ScoringService interface {
	CalculateScore(initiative domain.Initiative) (*domain.ScoreBreakdown, error)
}
