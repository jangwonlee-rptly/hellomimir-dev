# Project Structure

This document describes the organization of the hellomimir codebase.

## Directory Overview

```
hellomimir-dev/
├── backend/                    # Python FastAPI Backend
├── frontend/                   # Next.js Frontend
├── docs/                       # Documentation
├── supabase/                   # Database Migrations
├── devlog/                     # Development Logs
├── docker-compose.yml          # Production Docker Setup
├── docker-compose.dev.yml      # Development Docker Setup
├── .env.example                # Environment Variables Template
└── README.md                   # Project Overview
```

## Backend (`backend/`)

Python FastAPI service handling business logic, AI generation, and data ingestion.

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── api/                    # HTTP endpoints
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py       # Health/status endpoints
│   │       └── papers.py       # Paper ingestion endpoints
│   ├── core/                   # Core utilities
│   │   ├── __init__.py
│   │   ├── config.py           # Configuration (Pydantic Settings)
│   │   └── logging.py          # Logging setup
│   ├── db/                     # Database layer
│   │   ├── __init__.py
│   │   ├── models.py           # Pydantic models
│   │   └── supabase_client.py  # Supabase operations
│   └── services/               # Business logic
│       ├── __init__.py
│       ├── arxiv_service.py    # arXiv API client
│       ├── llm_service.py      # OpenAI integration
│       └── paper_service.py    # Ingestion orchestration
├── pyproject.toml              # Poetry dependencies
├── poetry.lock                 # Locked dependencies
├── Dockerfile                  # Multi-stage production build
├── docker-compose.yml          # Standalone backend service
├── .env.example                # Backend environment template
├── .dockerignore
├── .gitignore
├── README.md                   # Backend documentation
├── quickstart.sh               # Local dev quick start
└── test_ingestion.sh           # Integration test script
```

**Key Technologies:**
- Python 3.11+
- FastAPI (async web framework)
- Poetry (dependency management)
- Pydantic (data validation)
- Uvicorn (ASGI server)
- Supabase Python client
- OpenAI Python SDK

**Responsibilities:**
- Fetch papers from arXiv
- Generate summaries (3 levels) via OpenAI
- Generate quizzes via OpenAI
- Generate pre-reading materials (when full text available)
- Store all data in Supabase
- Expose RESTful API for ingestion triggers

## Frontend (`frontend/`)

Next.js application providing the user interface.

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Homepage
│   │   ├── api/               # API routes (thin proxies)
│   │   │   ├── cron/
│   │   │   │   └── daily-papers/
│   │   │   │       └── route.ts  # Proxies to backend
│   │   │   ├── fields/
│   │   │   │   └── route.ts      # Get all fields
│   │   │   └── field/
│   │   │       └── [slug]/
│   │   │           ├── archive/
│   │   │           ├── papers/
│   │   │           └── today/
│   │   ├── fields/
│   │   │   └── page.tsx       # Field selection
│   │   └── field/
│   │       └── [slug]/
│   │           └── page.tsx   # Paper viewing page
│   ├── components/             # React components
│   │   ├── PaperView.tsx
│   │   ├── PreReadingGuide.tsx
│   │   └── ...
│   ├── lib/                    # Utilities (mostly deprecated)
│   │   ├── supabaseClient.ts  # Read-only DB access
│   │   ├── arxivClient.ts     # (deprecated, use backend)
│   │   ├── llmClient.ts       # (deprecated, use backend)
│   │   └── dailyPaperService.ts  # (deprecated, use backend)
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── public/                     # Static assets
│   ├── favicon.ico
│   └── ...
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── Dockerfile                  # Next.js production build
├── .dockerignore
├── .env.local.example          # Frontend environment template
└── .gitignore
```

**Key Technologies:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Supabase JS client (read-only)

**Responsibilities:**
- Render UI (pages, components)
- Read from Supabase (anon key, read-only)
- Proxy cron requests to backend
- Handle user interactions (quiz answering, etc.)

**Does NOT:**
- Call arXiv directly (use backend)
- Call OpenAI directly (use backend)
- Write to database (use backend)
- Run ingestion logic (use backend)

## Documentation (`docs/`)

Comprehensive project documentation.

```
docs/
├── ARCHITECTURE.md             # System architecture deep dive
├── MIGRATION_GUIDE.md          # Next.js → FastAPI migration details
└── DOCKER_QUICKSTART.md        # Complete Docker setup guide
```

## Database (`supabase/`)

SQL migrations for Supabase PostgreSQL.

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql            # Core tables
    └── 002_add_full_text_and_prereading.sql  # Extended features
```

**Tables:**
- `fields` - Academic fields (AI/ML, Physics, etc.)
- `papers` - arXiv papers (metadata + abstract + full_text)
- `daily_papers` - One paper per field per date
- `paper_summaries` - Summaries at 3 reading levels
- `paper_quizzes` - Multiple-choice quizzes
- `paper_prereading` - Jargon, prerequisites, difficulty

## Development Logs (`devlog/`)

Session notes and progress tracking.

```
devlog/
├── 2512041509.txt
├── 2512041600.txt
├── 2512041630.txt
└── 2512041642.txt
```

These document:
- PDF extraction attempts
- Migration decisions
- Technical blockers
- Solutions and workarounds

## Docker Setup

### Production (`docker-compose.yml`)

Full stack production setup with both services.

```yaml
services:
  backend:   # Port 8000
  frontend:  # Port 3000
```

### Development (`docker-compose.dev.yml`)

Development setup with hot reloading.

```yaml
services:
  backend:   # Port 8000, with volume mounts
  frontend:  # Port 3000, with volume mounts
```

## Environment Variables

### Root (`.env.example`)

Shared environment variables for docker-compose:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Auth
CRON_SECRET=your-secret

# Optional
ARXIV_BASE_URL=http://export.arxiv.org/api/query
ARXIV_RATE_LIMIT_SECONDS=3
CLARIFAI_API_KEY=your-clarifai-key
DEBUG=false
```

### Backend (`backend/.env.example`)

Backend-specific environment variables (when running standalone).

### Frontend (`frontend/.env.local.example`)

Frontend-specific environment variables (when running standalone).

## Key Design Decisions

### Separation of Concerns

- **Frontend**: UI, read-only database access
- **Backend**: Business logic, AI, database writes
- **Database**: Single source of truth (Supabase)

### Why This Structure?

1. **Clear Ownership**: Each directory has a single responsibility
2. **Independent Deployment**: Backend and frontend can deploy separately
3. **Technology Fit**: Python for AI/data, Next.js for UI
4. **Scalability**: Each service can scale independently
5. **Maintainability**: Clear boundaries, easier to understand

### Migration from Monolith

Previously, all logic was in the Next.js app:
- Direct arXiv calls
- Direct OpenAI calls
- Database writes via service role key

Now:
- Next.js is a thin frontend + proxy
- FastAPI handles all backend logic
- Clear API contract between services

### Future Enhancements

The structure supports:
- PDF extraction in Python (no browser API issues)
- Vector embeddings (Python ecosystem)
- ML pipelines (Python libraries)
- Microservices (split backend further if needed)
- GraphQL (add layer on top of REST)

## Development Workflow

### Backend Development

```bash
cd backend
poetry install
poetry shell
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Full Stack Development

```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f
```

### Running Tests

```bash
# Backend
cd backend
./test_ingestion.sh

# Frontend
cd frontend
npm run build
npm run type-check
```

## Deployment

### Docker (Recommended)

```bash
docker-compose build
docker-compose up -d
```

### Separate Services

- Deploy backend to Railway/Fly.io/DigitalOcean
- Deploy frontend to Vercel/Netlify
- Set `BACKEND_API_URL` in frontend to backend URL

## Questions?

- See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for system design
- See [docs/DOCKER_QUICKSTART.md](../docs/DOCKER_QUICKSTART.md) for setup
- See [docs/MIGRATION_GUIDE.md](../docs/MIGRATION_GUIDE.md) for migration details
- See [backend/README.md](../backend/README.md) for backend-specific info
