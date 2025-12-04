# hellomimir Backend API

Python FastAPI backend service for the hellomimir daily academic paper platform.

## Features

- arXiv paper fetching and selection
- Abstract-based summary generation (3 reading levels)
- Quiz generation
- Pre-reading materials (when full text available)
- Supabase PostgreSQL database integration
- RESTful API endpoints for ingestion

## Tech Stack

- **Python 3.11+**
- **FastAPI** - Modern web framework
- **Poetry** - Dependency management
- **Uvicorn** - ASGI server
- **Supabase** - Database
- **OpenAI** - LLM generation
- **Docker** - Containerization

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   └── routes/
│   │       ├── health.py    # Health/status endpoints
│   │       └── papers.py    # Paper ingestion endpoints
│   ├── core/
│   │   ├── config.py        # Configuration management
│   │   └── logging.py       # Logging setup
│   ├── db/
│   │   ├── models.py        # Pydantic models
│   │   └── supabase_client.py  # Database operations
│   └── services/
│       ├── arxiv_service.py    # arXiv API client
│       ├── llm_service.py      # OpenAI LLM generation
│       └── paper_service.py    # Ingestion orchestration
├── pyproject.toml           # Poetry dependencies
├── poetry.lock              # Locked dependencies
├── Dockerfile               # Multi-stage production build
└── docker-compose.yml       # Standalone backend service
```

## Quick Start (Docker - Recommended)

### 1. Setup Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (not anon key)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o-mini
- `CRON_SECRET` - Secret for authenticating cron endpoints

### 2. Build and Run with Docker

```bash
# Build the image
docker-compose build

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

### 3. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Status check (includes DB connectivity)
curl http://localhost:8000/internal/status

# Run ingestion (requires CRON_SECRET)
curl -X POST http://localhost:8000/internal/papers/daily \
  -H "X-Cron-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'
```

## Local Development (Poetry)

### 1. Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

### 2. Install Dependencies

```bash
cd backend
poetry install
```

### 3. Activate Virtual Environment

```bash
poetry shell
```

### 4. Run Locally

```bash
# With auto-reload
uvicorn app.main:app --reload --port 8000

# Or use Poetry
poetry run uvicorn app.main:app --reload --port 8000
```

## API Endpoints

### Health & Status

- `GET /health` - Simple health check
  ```json
  {"status":"ok","timestamp":"...","version":"1.0.0"}
  ```

- `GET /internal/status` - Detailed status with service checks
  ```json
  {
    "status":"ok",
    "database_connected":true,
    "services":{"supabase":"connected","arxiv":"available"}
  }
  ```

### Paper Ingestion

- `POST /internal/papers/daily` - Run daily ingestion for all fields
  - **Headers**: `X-Cron-Secret: your-secret`
  - **Body** (optional): `{"date": "YYYY-MM-DD"}`
  - **Response**:
    ```json
    {
      "message": "Processed 5 fields",
      "date": "2025-12-04",
      "success_count": 5,
      "fail_count": 0,
      "results": [...]
    }
    ```

## Testing

### Run Test Script

```bash
./test_ingestion.sh
```

This will:
1. Check health endpoint
2. Check status endpoint
3. Run a test ingestion
4. Report results

### Manual Testing

```bash
# Set environment variables
export BACKEND_URL=http://localhost:8000
export CRON_SECRET=your-secret

# Test health
curl $BACKEND_URL/health

# Test ingestion
curl -X POST $BACKEND_URL/internal/papers/daily \
  -H "X-Cron-Secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'
```

## Docker Commands

```bash
# Build image
docker build -t hellomimir-backend .

# Run container
docker run -p 8000:8000 --env-file .env hellomimir-backend

# Run with docker-compose
docker-compose up -d

# View logs
docker logs hellomimir-backend
# or
docker-compose logs -f

# Stop container
docker-compose down

# Rebuild after code changes
docker-compose build
docker-compose up -d
```

## Poetry Commands

```bash
# Install dependencies
poetry install

# Add a new dependency
poetry add package-name

# Add dev dependency
poetry add --group dev package-name

# Update dependencies
poetry update

# Show installed packages
poetry show

# Run a command in the virtual environment
poetry run python script.py

# Activate shell
poetry shell

# Lock dependencies
poetry lock
```

## Deployment

### Production Checklist

1. Set `DEBUG=false` in environment
2. Use strong `CRON_SECRET`
3. Restrict backend access (firewall, VPC)
4. Set up monitoring (logs, health checks)
5. Configure scheduler to call ingestion endpoint daily

### Environment Variables (Production)

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
CRON_SECRET=strong-random-secret

# Optional
ARXIV_BASE_URL=http://export.arxiv.org/api/query
ARXIV_RATE_LIMIT_SECONDS=3
CLARIFAI_API_KEY=your-clarifai-key
DEBUG=false
```

### Deployment Platforms

**Docker-based:**
- Railway
- Fly.io
- DigitalOcean App Platform
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances

**Scheduler Setup:**
Set up a daily cron job to call:
```bash
curl -X POST https://your-backend.com/internal/papers/daily \
  -H "X-Cron-Secret: $CRON_SECRET"
```

Use:
- GitHub Actions (with schedule trigger)
- Cloud scheduler (GCP, AWS EventBridge)
- Cron job on server

## Troubleshooting

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check IP allowlist in Supabase settings
- Ensure service role key (not anon key)

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is valid
- Check API quota and rate limits
- Review logs for specific error messages

### arXiv Rate Limiting

- Default: 1 request per 3 seconds
- Adjust `ARXIV_RATE_LIMIT_SECONDS` if needed
- Be respectful of arXiv's terms

### Docker Build Failures

- Ensure Poetry lock file is up to date: `poetry lock`
- Check Python version compatibility
- Clear Docker build cache: `docker-compose build --no-cache`

## Development Workflow

1. **Make code changes** in `app/` directory
2. **Test locally**:
   ```bash
   poetry run uvicorn app.main:app --reload
   ```
3. **Format code**:
   ```bash
   poetry run black app/
   poetry run ruff check app/
   ```
4. **Build Docker image**:
   ```bash
   docker-compose build
   ```
5. **Test in Docker**:
   ```bash
   docker-compose up
   ./test_ingestion.sh
   ```

## Architecture

See [ARCHITECTURE.md](../ARCHITECTURE.md) in the project root for full system architecture.

## Migration Guide

See [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) for details on the Next.js → FastAPI migration.

## License

Same as parent project
