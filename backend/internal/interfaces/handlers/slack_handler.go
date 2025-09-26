package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type SlackHandler struct{}

type SlackMessageRequest struct {
	Channel string `json:"channel"`
	Text    string `json:"text"`
}

type SlackMessageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func NewSlackHandler() *SlackHandler {
	return &SlackHandler{}
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
