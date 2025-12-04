# Docker Quick Start Guide

Complete guide for running hellomimir in Docker with Poetry.

## Prerequisites

- Docker & Docker Compose installed
- Git
- Environment variables configured

## Setup Steps

### 1. Clone and Configure

```bash
# Navigate to project directory
cd hellomimir-dev

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

Required environment variables in `.env`:
```bash
# Supabase (Backend uses service role, Frontend uses anon key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Authentication
CRON_SECRET=your-strong-secret

# Optional
ARXIV_BASE_URL=http://export.arxiv.org/api/query
ARXIV_RATE_LIMIT_SECONDS=3
CLARIFAI_API_KEY=your-clarifai-key
DEBUG=false
```

### 2. Build and Run (Production Mode)

```bash
# Build all services
docker-compose build

# Start all services (backend + frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Backend Docs**: http://localhost:8000/docs

### 3. Test the System

```bash
# Test backend health
curl http://localhost:8000/health

# Test backend status (includes DB check)
curl http://localhost:8000/internal/status

# Test ingestion (replace YOUR_SECRET)
curl -X POST http://localhost:8000/internal/papers/daily \
  -H "X-Cron-Secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'

# Test through frontend proxy
curl -X POST http://localhost:3000/api/cron/daily-papers \
  -H "X-Cron-Secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'

# Visit frontend
open http://localhost:3000
```

## Development Mode (Optional)

For development with hot reloading:

```bash
# Use development docker-compose
docker-compose -f docker-compose.dev.yml up -d

# View logs with auto-reload enabled
docker-compose -f docker-compose.dev.yml logs -f
```

Development mode features:
- ✅ Code changes reflect immediately (no rebuild needed)
- ✅ Volume mounts for live editing
- ✅ Debug mode enabled
- ✅ Detailed logging

## Backend-Only Mode

To run just the backend (useful for development):

```bash
cd backend

# Configure backend environment
cp .env.example .env
# Edit .env with backend credentials

# Build and run backend only
docker-compose up -d

# Backend available at http://localhost:8000
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Stop Services

```bash
# Stop all (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove volumes (WARNING: data loss)
docker-compose down -v
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Rebuild all
docker-compose build
docker-compose up -d

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

### Execute Commands Inside Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run backend command
docker-compose exec backend poetry run python -c "print('Hello')"

# Check backend health
docker-compose exec backend curl http://localhost:8000/health
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Missing environment variables
docker-compose exec backend env | grep SUPABASE

# 2. Database connection
docker-compose exec backend curl http://localhost:8000/internal/status

# 3. Poetry/dependency issues
docker-compose build --no-cache backend
```

### Frontend Won't Start

```bash
# Check logs
docker-compose logs frontend

# Common issues:
# 1. Backend not ready
docker-compose ps

# 2. Build errors
docker-compose build --no-cache frontend

# 3. Port conflicts
lsof -i :3000
docker-compose down && docker-compose up -d
```

### Database Connection Errors

```bash
# Test from backend container
docker-compose exec backend sh -c '
  curl -X POST http://localhost:8000/internal/status
'

# Check environment variables
docker-compose exec backend printenv | grep SUPABASE

# Verify credentials in Supabase dashboard
# - Go to Settings > API
# - Check Project URL matches SUPABASE_URL
# - Check service_role key matches SUPABASE_SERVICE_ROLE_KEY
```

### Permission Errors

```bash
# Backend runs as non-root user (appuser)
# If you encounter permission issues:

# Check ownership
docker-compose exec backend ls -la /app

# Rebuild if needed
docker-compose build --no-cache backend
```

### Poetry/Dependency Issues

```bash
# If dependencies are not installing:

# 1. Ensure poetry.lock exists
cd backend
ls -la poetry.lock

# 2. If missing, generate it locally:
# (Requires Poetry installed locally)
poetry lock

# 3. Rebuild Docker image
docker-compose build --no-cache backend
```

## Performance Tips

### Optimize Build Time

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Or set globally
export DOCKER_BUILDKIT=1
```

### Optimize Container Resources

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Clean Up Docker Resources

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Nuclear option (removes everything)
docker system prune -a
```

## Production Deployment

### Using Docker Compose in Production

```bash
# 1. Copy files to server
scp -r hellomimir-dev user@server:/app/

# 2. SSH into server
ssh user@server

# 3. Configure environment
cd /app/hellomimir-dev
cp .env.example .env
nano .env

# 4. Build and run
docker-compose build
docker-compose up -d

# 5. Set up systemd service (optional)
sudo nano /etc/systemd/system/hellomimir.service
```

Example systemd service:
```ini
[Unit]
Description=hellomimir Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/app/hellomimir-dev
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable hellomimir
sudo systemctl start hellomimir
sudo systemctl status hellomimir
```

### Health Checks and Monitoring

```bash
# Check all services are healthy
docker-compose ps

# Set up monitoring (optional)
docker stats

# Log rotation (important for production)
# Docker automatically rotates logs, but you can configure:
# /etc/docker/daemon.json
```

## Environment-Specific Configurations

### Development

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Staging

```bash
# Use staging environment file
docker-compose --env-file .env.staging up -d
```

### Production

```bash
# Use production environment file
docker-compose --env-file .env.production up -d
```

## Backup and Restore

### Backup

```bash
# Backup database (via Supabase dashboard or CLI)
# Backup .env files
cp .env .env.backup

# Export Docker volumes (if any)
docker volume ls
```

### Restore

```bash
# Restore .env
cp .env.backup .env

# Rebuild and restart
docker-compose down
docker-compose up -d
```

## Next Steps

1. ✅ Services running in Docker
2. 🔄 Configure scheduler to call `/api/cron/daily-papers` daily
3. 🔄 Set up monitoring (e.g., Uptime Kuma, Grafana)
4. 🔄 Configure SSL/TLS (e.g., nginx-proxy with Let's Encrypt)
5. 🔄 Set up backups (database, configs)

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Poetry Documentation](https://python-poetry.org/docs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment)

## Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Check service status: `docker-compose ps`
3. Verify environment variables: `docker-compose config`
4. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
5. Review [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
