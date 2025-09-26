package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type SlackHandler struct {
	usersCache     []SlackUser
	cacheTimestamp time.Time
	cacheMutex     sync.RWMutex
	cacheDuration  time.Duration
}

type SlackMessageRequest struct {
	Channel string `json:"channel"`
	Text    string `json:"text"`
}

type SlackMessageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

type SlackUser struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	RealName string `json:"real_name"`
	Email    string `json:"email,omitempty"`
	IsBot    bool   `json:"is_bot"`
}

type SlackUsersResponse struct {
	Success bool        `json:"success"`
	Users   []SlackUser `json:"users,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func NewSlackHandler() *SlackHandler {
	return &SlackHandler{
		cacheDuration: 15 * time.Minute, // Cache por 15 minutos
	}
}

// isCacheValid verifica si el caché es válido
func (h *SlackHandler) isCacheValid() bool {
	h.cacheMutex.RLock()
	defer h.cacheMutex.RUnlock()
	return time.Since(h.cacheTimestamp) < h.cacheDuration && len(h.usersCache) > 0
}

func (h *SlackHandler) SendMessage(c *gin.Context) {
	var req SlackMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, SlackMessageResponse{
			Success: false,
			Error:   "Invalid request format",
		})
		return
	}

	// Validar que tenemos el token de Slack
	slackToken := os.Getenv("SLACK_WOW_TOKEN")
	if slackToken == "" {
		c.JSON(http.StatusInternalServerError, SlackMessageResponse{
			Success: false,
			Error:   "Slack token not configured",
		})
		return
	}

	// Preparar la llamada a la API de Slack
	slackURL := "https://slack.com/api/chat.postMessage"

	payload := map[string]interface{}{
		"channel": req.Channel,
		"text":    req.Text,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, SlackMessageResponse{
			Success: false,
			Error:   "Failed to prepare Slack message",
		})
		return
	}

	// Crear la request HTTP
	httpReq, err := http.NewRequest("POST", slackURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, SlackMessageResponse{
			Success: false,
			Error:   "Failed to create Slack request",
		})
		return
	}

	// Configurar headers
	httpReq.Header.Set("Authorization", "Bearer "+slackToken)
	httpReq.Header.Set("Content-Type", "application/json")

	// Enviar la request
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, SlackMessageResponse{
			Success: false,
			Error:   "Failed to send message to Slack",
		})
		return
	}
	defer resp.Body.Close()

	// Leer la respuesta de Slack
	var slackResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&slackResp); err != nil {
		c.JSON(http.StatusInternalServerError, SlackMessageResponse{
			Success: false,
			Error:   "Failed to parse Slack response",
		})
		return
	}

	// Verificar si el mensaje se envió correctamente
	if ok, exists := slackResp["ok"]; !exists || !ok.(bool) {
		errorMsg := "Unknown error"
		if errMsg, exists := slackResp["error"]; exists {
			errorMsg = errMsg.(string)
		}

		c.JSON(http.StatusBadRequest, SlackMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Slack API error: %s", errorMsg),
		})
		return
	}

	c.JSON(http.StatusOK, SlackMessageResponse{
		Success: true,
		Message: "Message sent successfully",
	})
}

func (h *SlackHandler) GetUsers(c *gin.Context) {
	// Verificar si tenemos caché válido
	if h.isCacheValid() {
		h.cacheMutex.RLock()
		users := make([]SlackUser, len(h.usersCache))
		copy(users, h.usersCache)
		h.cacheMutex.RUnlock()

		c.JSON(http.StatusOK, SlackUsersResponse{
			Success: true,
			Users:   users,
		})
		return
	}

	// Validar que tenemos el token de Slack
	slackToken := os.Getenv("SLACK_WOW_TOKEN")
	if slackToken == "" {
		c.JSON(http.StatusInternalServerError, SlackUsersResponse{
			Success: false,
			Error:   "Slack token not configured",
		})
		return
	}

	// Llamar a la API de Slack para obtener usuarios
	slackURL := "https://slack.com/api/users.list"

	httpReq, err := http.NewRequest("GET", slackURL, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, SlackUsersResponse{
			Success: false,
			Error:   "Failed to create Slack request",
		})
		return
	}

	// Configurar headers
	httpReq.Header.Set("Authorization", "Bearer "+slackToken)
	httpReq.Header.Set("Content-Type", "application/json")

	// Enviar la request
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, SlackUsersResponse{
			Success: false,
			Error:   "Failed to fetch users from Slack",
		})
		return
	}
	defer resp.Body.Close()

	// Leer la respuesta de Slack
	var slackResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&slackResp); err != nil {
		c.JSON(http.StatusInternalServerError, SlackUsersResponse{
			Success: false,
			Error:   "Failed to parse Slack response",
		})
		return
	}

	// Verificar si la respuesta es exitosa
	if ok, exists := slackResp["ok"]; !exists || !ok.(bool) {
		errorMsg := "Unknown error"
		if errMsg, exists := slackResp["error"]; exists {
			errorMsg = errMsg.(string)
		}

		c.JSON(http.StatusBadRequest, SlackUsersResponse{
			Success: false,
			Error:   fmt.Sprintf("Slack API error: %s", errorMsg),
		})
		return
	}

	// Procesar la lista de usuarios
	users := []SlackUser{}
	if members, exists := slackResp["members"]; exists {
		if membersList, ok := members.([]interface{}); ok {
			for _, member := range membersList {
				if memberMap, ok := member.(map[string]interface{}); ok {
					// Solo incluir usuarios reales (no bots) y activos (no eliminados)
					if isBot, exists := memberMap["is_bot"]; !exists || !isBot.(bool) {
						// Verificar que el usuario no esté eliminado/inactivo
						if deleted, exists := memberMap["deleted"]; !exists || !deleted.(bool) {
							user := SlackUser{
								ID:       getStringValue(memberMap, "id"),
								Name:     getStringValue(memberMap, "name"),
								RealName: getStringValue(memberMap, "real_name"),
								IsBot:    getBoolValue(memberMap, "is_bot"),
							}

							// Intentar obtener el email del perfil
							if profile, exists := memberMap["profile"]; exists {
								if profileMap, ok := profile.(map[string]interface{}); ok {
									user.Email = getStringValue(profileMap, "email")
								}
							}

							users = append(users, user)
						}
					}
				}
			}
		}
	}

	// Guardar en caché
	h.cacheMutex.Lock()
	h.usersCache = make([]SlackUser, len(users))
	copy(h.usersCache, users)
	h.cacheTimestamp = time.Now()
	h.cacheMutex.Unlock()

	c.JSON(http.StatusOK, SlackUsersResponse{
		Success: true,
		Users:   users,
	})
}

// Funciones auxiliares para extraer valores de mapas
func getStringValue(m map[string]interface{}, key string) string {
	if val, exists := m[key]; exists {
		if str, ok := val.(string); ok {
			return str
		}
	}
	return ""
}

func getBoolValue(m map[string]interface{}, key string) bool {
	if val, exists := m[key]; exists {
		if b, ok := val.(bool); ok {
			return b
		}
	}
	return false
}
