# hellomimir - Daily Academic Paper Platform

**Learn a paper a day** - A web platform that delivers daily academic papers with AI-generated summaries and quizzes at multiple reading levels.

## 🏗️ Architecture

hellomimir uses a **separated frontend + backend architecture**:

- **Frontend**: Next.js 14+ (React, TypeScript, Tailwind CSS)
- **Backend**: Python FastAPI (async, Poetry, Pydantic)
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI GPT-4o-mini
- **Deployment**: Docker + Docker Compose

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Next.js Frontend       │ ← UI, SSR, Read-only DB access
│  (Port 3000)            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  FastAPI Backend        │ ← Business logic, AI, DB writes
│  (Port 8000)            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Supabase PostgreSQL    │ ← Papers, summaries, quizzes
└─────────────────────────┘
```

## ✨ Features

- **Daily Papers**: Automatically fetch and display new papers from arXiv
- **Multi-Level Summaries**: AI-generated explanations for 3 reading levels (grade 5, middle school, high school)
- **Interactive Quizzes**: Test your understanding with multiple-choice questions
- **Pre-Reading Materials**: Jargon definitions, prerequisites, difficulty assessment
- **Multiple Fields**: AI/ML, Computer Science, Physics, Mathematics, Statistics
- **Mobile-First Design**: Works great on phones and tablets
- **Archive Access**: Browse previous days' papers

## 🚀 Quick Start (Docker - Recommended)

See **[docs/DOCKER_QUICKSTART.md](./docs/DOCKER_QUICKSTART.md)** for complete Docker setup guide.

### TL;DR

```bash
# 1. Clone and configure
git clone <repo>
cd hellomimir-dev
cp .env.example .env
nano .env  # Add your credentials

# 2. Run database migrations in Supabase SQL Editor
#    - supabase/migrations/001_initial_schema.sql
#    - supabase/migrations/002_add_full_text_and_prereading.sql

# 3. Build and run with Docker
docker-compose build
docker-compose up -d

# 4. Test
curl http://localhost:8000/health  # Backend
open http://localhost:3000          # Frontend
```

## 📚 Documentation

- **[docs/DOCKER_QUICKSTART.md](./docs/DOCKER_QUICKSTART.md)** - Complete Docker setup
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[docs/MIGRATION_GUIDE.md](./docs/MIGRATION_GUIDE.md)** - Next.js → FastAPI migration
- **[backend/README.md](./backend/README.md)** - Backend-specific docs

## 🛠️ Development

### Backend (Poetry + Docker)

```bash
cd backend
docker-compose up -d  # or poetry install && poetry run uvicorn app.main:app --reload
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Full Stack

```bash
docker-compose up -d              # Production mode
docker-compose -f docker-compose.dev.yml up -d  # Development mode
```

## 📦 Project Structure

```
hellomimir-dev/
├── backend/                  # Python FastAPI backend
│   ├── app/                  # Application code
│   │   ├── api/routes/      # HTTP endpoints
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database operations
│   │   └── core/            # Config, logging
│   ├── pyproject.toml        # Poetry dependencies
│   ├── Dockerfile            # Multi-stage build
│   └── README.md
├── frontend/                 # Next.js frontend
│   ├── src/                  # Application code
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   ├── public/              # Static assets
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local.example
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md
│   ├── MIGRATION_GUIDE.md
│   └── DOCKER_QUICKSTART.md
├── supabase/                 # Database
│   └── migrations/          # SQL schema migrations
├── devlog/                   # Development logs
├── docker-compose.yml        # Full stack (production)
├── docker-compose.dev.yml    # Full stack (development)
├── .env.example              # Environment template
└── README.md                 # This file
```

## 📝 Current Status: Abstract-Only Mode

**What works:**
- ✅ Papers fetched from arXiv (metadata + abstract)
- ✅ Summaries generated from abstract (3 levels)
- ✅ Quizzes generated from abstract

**What's next:**
- 🔜 PDF full-text extraction in Python backend
- 🔜 Pre-reading materials with full text
- 🔜 Image-based OCR (DeepSeek/Clarifai)

**Why abstract-only?** JavaScript PDF libraries require browser APIs that don't work in Node.js/Next.js. The Python backend is designed to fix this.

## 🧪 Testing

```bash
# Backend
cd backend
./test_ingestion.sh

# Frontend
cd frontend
npm run build
open http://localhost:3000
```

## 🚀 Deployment

**Option 1: Docker on VPS**
```bash
docker-compose up -d
```

**Option 2: Separate Services**
- Frontend: Vercel, Netlify
- Backend: Railway, Fly.io, DigitalOcean

**Set up daily scheduler** to call:
```bash
curl -X POST https://your-api.com/internal/papers/daily \
  -H "X-Cron-Secret: your-secret"
```

## 🛣️ Roadmap

- [x] Separate frontend + backend architecture
- [x] Poetry + Docker setup
- [x] Clean project structure
- [ ] PDF extraction in Python
- [ ] Pre-reading materials
- [ ] Vector embeddings & semantic search
- [ ] User accounts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit PR

## 📄 License

MIT

## 🙏 Acknowledgments

- arXiv for open access papers
- OpenAI for GPT-4o-mini
- Supabase for database
- FastAPI & Next.js communities

---

Built with ❤️ for making academic papers accessible to everyone.
