# Pomelo Wishlist - Initiative Prioritization System

Una aplicación Go completa para gestionar el ciclo completo de priorización de iniciativas, con un agente inteligente que asiste en el proceso de intake, estimación técnica y scoring.

## Características Principales

### 🤖 Agente Inteligente
- **Intake asistido**: Entrevista y normaliza información de nuevas iniciativas
- **Estimación técnica guiada**: Ayuda a managers de IT a estimar esfuerzo y riesgos
- **Scoring automático**: Aplica matriz de decisión para generar puntajes

### 👥 Gestión de Roles
- **Creator**: Propone iniciativas mediante intake guiado
- **Reviewer**: Comenta y aporta contexto en revisión colaborativa
- **IT Manager**: Estima esfuerzo y confianza con ayuda del agente
- **Owner**: Valida evaluación final y habilita priorización
- **Admin**: Administra usuarios y configuraciones

### 📊 Sistema de Scoring
Matriz de decisión con múltiples dimensiones:
- Categoría (Regulatorio/Riesgo/Performance/Value Prop/Nuevo Producto)
- Vertical y tipo de cliente
- País e impacto económico
- Experiencia e innovación
- Reglas especiales y desempate

## Arquitectura

```
cmd/api/                    # Punto de entrada de la aplicación
internal/
  ├── domain/              # Modelos de dominio y entidades
  ├── application/         # Lógica de aplicación
  │   ├── agent/          # Sistema de agente inteligente
  │   └── scoring/        # Motor de scoring y priorización
  ├── infrastructure/     # Infraestructura (DB, server)
  └── interfaces/         # Interfaces HTTP (handlers, middleware)
migrations/                # Migraciones de base de datos
```

## Tecnologías

- **Backend**: Go 1.21+ con Gin framework
- **Base de datos**: PostgreSQL con GORM
- **Autenticación**: JWT tokens
- **API**: REST con JSON

## 🚀 Inicio Rápido con Docker

### Prerrequisitos
- Docker y Docker Compose instalados

### Ejecutar la aplicación

1. **Clonar y levantar todo con Docker:**
```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# O usando el Makefile
make build && make up
```

2. **La API estará disponible en `http://localhost:8080`**

3. **Ver logs en tiempo real:**
```bash
docker-compose logs -f
# O con Makefile
make logs
```

### Comandos útiles

```bash
# Parar todos los servicios
docker-compose down
# O: make down

# Limpiar todo (contenedores, volúmenes, imágenes)
docker-compose down -v && docker system prune -f
# O: make clean

# Reiniciar servicios
docker-compose restart
# O: make restart
```

## Desarrollo Local

### Opción 1: Solo Base de Datos en Docker
```bash
# Levantar solo PostgreSQL
make db

# Ejecutar la app localmente
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=pomelo_wishlist
export JWT_SECRET=your-secret-key
go run cmd/api/main.go
```

### Opción 2: Todo Local
```bash
# Instalar dependencias
go mod tidy

# Configurar PostgreSQL local y ejecutar migraciones
createdb pomelo_wishlist
psql -d pomelo_wishlist -f migrations/001_initial_schema.sql
psql -d pomelo_wishlist -f migrations/002_seed_data.sql

# Ejecutar aplicación
make dev
```

### Endpoints Principales

#### Autenticación
- `POST /auth/login` - Autenticar usuario
- `POST /auth/register` - Registrar nuevo usuario

#### Iniciativas
- `GET /api/initiatives` - Listar iniciativas (con filtros)
- `POST /api/initiatives` - Crear nueva iniciativa
- `GET /api/initiatives/:id` - Obtener iniciativa específica
- `PUT /api/initiatives/:id` - Actualizar iniciativa
- `POST /api/initiatives/:id/score` - Calcular puntaje

#### Agente
- `POST /api/agent/intake` - Intervención de intake
- `POST /api/agent/estimation` - Intervención de estimación
- `POST /api/agent/scoring` - Intervención de scoring

#### Chat y Colaboración
- `GET /api/initiatives/:id/messages` - Obtener mensajes
- `POST /api/initiatives/:id/messages` - Agregar mensaje
- `GET /api/initiatives/:id/suggestions` - Obtener sugerencias del agente

## Estados del Proceso

1. **Borrador** - Creator inicia intake
2. **Iniciativa cargada** - Intake validado y guardado
3. **En revisión** - Chat colaborativo entre reviewers
4. **En estimación** - IT Manager completa estimación técnica
5. **Evaluación cerrada** - Ficha completa
6. **Priorizada** - Score aplicado y ordenada en pipeline

## Testing

```bash
# Ejecutar tests
go test ./...

# Test con coverage
go test -cover ./...
```

## Despliegue

### Docker (Futuro)
```bash
docker-compose up -d
```

### Build para producción
```bash
go build -o pomelo-wishlist cmd/api/main.go
./pomelo-wishlist
```