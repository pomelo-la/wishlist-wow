# Backend - Wishlist Wow

## Configuración

### Variables de Entorno

Crea un archivo `config.env` en el directorio `backend/` con las siguientes variables:

```env
# Cloudflare AI Gateway Configuration
CLOUDFLARE_AI_GATEWAY_TOKEN=tu_token_aqui
CLOUDFLARE_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/tu_account_id/pomethon_wow/openai/v1
```

**IMPORTANTE**: El archivo `config.env` está en `.gitignore` y no se subirá al repositorio por seguridad.

### Instalación

```bash
cd backend
go mod tidy
go run cmd/api/main.go
```

## Estructura del Proyecto

- `cmd/api/main.go` - Punto de entrada de la aplicación
- `internal/` - Código interno de la aplicación
  - `application/` - Lógica de negocio
  - `domain/` - Modelos de dominio
  - `infrastructure/` - Infraestructura (base de datos, servidor)
  - `interfaces/` - Handlers HTTP y middleware
- `migrations/` - Migraciones de base de datos
- `config.env` - Variables de entorno (no versionado)

## API Endpoints

- `GET /health` - Health check
- `POST /api/agent/intake` - Intake de iniciativas
- `POST /api/agent/estimation` - Estimación de iniciativas
- `POST /api/agent/scoring` - Scoring de iniciativas