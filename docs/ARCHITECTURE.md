# hellomimir Architecture

## Overview

hellomimir is a daily academic paper platform with a **separated frontend + backend architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js Frontend (Port 3000)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • React UI (papers, summaries, quizzes)              │  │
│  │ • Supabase Client (read-only, anon key)             │  │
│  │ • Proxy routes (forwards to backend)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Python FastAPI Backend (Port 8000)             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ • arXiv API Client (rate-limited)                    │  │
│  │ • LLM Service (OpenAI GPT-4o-mini)                   │  │
│  │ • Supabase Client (service role, write access)      │  │
│  │ • Paper Ingestion Orchestration                      │  │
│  │ • RESTful API Endpoints                              │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tables:                                               │  │
│  │   • fields (AI/ML, CS, Physics, etc.)                │  │
│  │   • papers (arXiv metadata + abstract)               │  │
│  │   • daily_papers (date → field → paper)              │  │
│  │   • paper_summaries (3 reading levels)               │  │
│  │   • paper_quizzes (multiple choice)                  │  │
│  │   • paper_prereading (jargon, prereqs, difficulty)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

External Services:
  • arXiv API (paper metadata)
  • OpenAI API (summaries, quizzes, prereading)
```

## Components

### 1. Next.js Frontend

**Purpose:** User-facing web application

**Technologies:**
- Next.js 14+ (App Router)
- React
- TypeScript
- Tailwind CSS
- Supabase JS client

**Responsibilities:**
- Render UI (paper details, summaries, quizzes)
- Read from Supabase (anon key, read-only access)
- Proxy cron requests to backend
- Handle user interactions (quiz answering, etc.)

**Does NOT:**
- Call arXiv directly
- Call OpenAI directly
- Write to database
- Run ingestion logic

**Key Files:**
- `src/app/field/[slug]/page.tsx` - Field page
- `src/app/api/cron/daily-papers/route.ts` - Proxy to backend
- `src/components/PaperView.tsx` - Paper display component

### 2. Python FastAPI Backend

**Purpose:** Business logic, AI generation, and data ingestion

**Technologies:**
- Python 3.11+
- FastAPI
- Uvicorn (ASGI server)
- Supabase Python client
- OpenAI Python SDK
- httpx (HTTP client)

**Responsibilities:**
- Fetch papers from arXiv
- Generate summaries (3 reading levels) via OpenAI
- Generate quizzes via OpenAI
- Generate pre-reading materials (if full text available)
- Write all data to Supabase
- Provide HTTP API for ingestion triggers

**API Endpoints:**
- `GET /health` - Health check
- `GET /internal/status` - Detailed status
- `POST /internal/papers/daily` - Run daily ingestion

**Key Files:**
- `backend/app/main.py` - FastAPI app
- `backend/app/services/paper_service.py` - Ingestion orchestration
- `backend/app/services/arxiv_service.py` - arXiv client
- `backend/app/services/llm_service.py` - OpenAI client
- `backend/app/db/supabase_client.py` - Database operations

### 3. Supabase Database

**Purpose:** PostgreSQL database with auth and real-time capabilities

**Schema:**

```sql
fields
  - id (uuid)
  - slug (text, unique)
  - name (text)
  - arxiv_query (text)

papers
  - id (uuid)
  - arxiv_id (text, unique)
  - title (text)
  - abstract (text)
  - full_text (text, nullable)
  - authors_json (jsonb)
  - categories (text[])
  - pdf_url (text)
  - published_at (timestamptz)

daily_papers
  - id (uuid)
  - date (date)
  - field_id (uuid) → fields
  - paper_id (uuid) → papers
  - UNIQUE(date, field_id)

paper_summaries
  - id (uuid)
  - paper_id (uuid) → papers
  - field_id (uuid) → fields
  - level (enum: grade5, middle, high)
  - summary_text (text)
  - UNIQUE(paper_id, field_id, level)

paper_quizzes
  - id (uuid)
  - paper_id (uuid) → papers
  - field_id (uuid) → fields
  - quiz_json (jsonb)
  - UNIQUE(paper_id, field_id)

paper_prereading
  - id (uuid)
  - paper_id (uuid) → papers
  - field_id (uuid) → fields
  - jargon_json (jsonb)
  - prerequisites_json (jsonb)
  - difficulty_level (enum: beginner, intermediate, advanced, expert)
  - estimated_read_time_minutes (int)
  - key_concepts (text[])
  - UNIQUE(paper_id, field_id)
```

## Data Flow

### Daily Ingestion Pipeline

```
1. Cron/Scheduler triggers POST /api/cron/daily-papers
                         ↓
2. Next.js proxy forwards to FastAPI backend
                         ↓
3. FastAPI backend processes each field:
   a. Fetch papers from arXiv (50 results, sorted by date)
   b. Filter out already-used papers
   c. Select newest unused paper
   d. Store paper metadata in Supabase
   e. Generate 3 summaries (grade5, middle, high) via OpenAI
   f. Generate quiz (6-8 questions) via OpenAI
   g. Generate prereading materials (if full text available)
   h. Store all content in Supabase
   i. Create daily_papers entry
                         ↓
4. Return results (success/failure for each field)
```

### User Viewing a Paper

```
1. User visits /field/ai-ml
                         ↓
2. Next.js server-side fetches from Supabase:
   - Today's daily_paper for field
   - Paper metadata
   - Summaries (all 3 levels)
   - Quiz
   - Prereading materials
                         ↓
3. Render UI with all content
                         ↓
4. User interacts (read summaries, take quiz)
   (All client-side, no backend calls)
```

## Current Mode: Abstract-Only

The system currently operates in **abstract-only mode**:

- ✅ Papers fetched from arXiv (metadata + abstract)
- ✅ Summaries generated from abstract (3 levels)
- ✅ Quizzes generated from abstract
- ❌ Full text extraction (NOT implemented)
- ⚠️ Pre-reading materials (only if full_text is available, which it isn't currently)

### Why Abstract-Only?

Previous attempts to extract full PDF text in Node.js/Next.js failed due to:
- JavaScript PDF libraries depend on browser APIs (Canvas, Web Workers)
- Next.js standalone builds don't support these APIs
- All attempts (pdf.js-extract, pdf-parse) failed at runtime

### Future: Full-Text Mode

The Python backend is **designed to support full-text extraction**:

1. **Approach 1: Python PDF libraries**
   - pypdf, pdfplumber, pymupdf
   - Native system tools (poppler, tesseract)
   - Clean extraction without browser dependencies

2. **Approach 2: External Service**
   - Replicate API (pre-trained OCR models)
   - AWS Textract (managed service)
   - Custom microservice with poppler

3. **Implementation location:**
   - Add PDF extraction in `backend/app/services/pdf_service.py`
   - Call from `paper_service.py` after storing paper
   - Store full_text in papers table
   - Pre-reading generation will automatically work

## Deployment

### Development

```bash
# Terminal 1: Backend
cd backend
./quickstart.sh

# Terminal 2: Frontend
npm run dev

# Terminal 3: Test ingestion
cd backend
./test_ingestion.sh
```

### Production

**Option A: Separate Services**
- Frontend: Vercel, Netlify, or any Next.js host
- Backend: Railway, Fly.io, DigitalOcean, AWS ECS

**Option B: Docker Compose**
```bash
# In backend/
docker-compose up -d
```

**Scheduler Setup:**
- Use cron, GitHub Actions, or cloud scheduler
- Call: `POST https://your-nextjs.com/api/cron/daily-papers`
- Frequency: Once per day (e.g., 6 AM UTC)

## Security

### Authentication

- **Frontend:** Uses Supabase anon key (read-only access, row-level security)
- **Backend:** Uses Supabase service role key (full access)
- **Cron endpoint:** Protected by `X-Cron-Secret` header

### Network

- Backend endpoints are under `/internal/*` (should be internal-only in production)
- Frontend proxies authenticated requests to backend
- Direct backend access should be restricted (firewall, VPC, etc.)

## Monitoring

### Health Checks

- Next.js: Standard Next.js health (built-in)
- Backend: `GET /health` endpoint
- Database: Checked via `/internal/status`

### Logs

- Next.js: Standard Next.js logging
- Backend: Structured Python logging (stdout)
- Both should be captured by your hosting platform

## Benefits of This Architecture

1. **Separation of Concerns**
   - Frontend = UI
   - Backend = Business logic + AI + Data

2. **Technology Fit**
   - Next.js excels at UI and SSR
   - Python excels at AI, PDF, and data processing

3. **Scalability**
   - Scale frontend and backend independently
   - Add backend workers easily

4. **Maintainability**
   - Clear boundaries
   - Easier testing
   - Better error isolation

5. **Future-Proof**
   - Easy to add PDF extraction
   - Can integrate any Python AI library
   - Can switch to GPU instances for backend

## Next Steps

1. ✅ Complete backend migration (DONE)
2. ⏳ Test end-to-end ingestion
3. 🔜 Implement PDF extraction in Python
4. 🔜 Add pre-reading materials with full text
5. 🔜 Deploy to production
6. 🔜 Set up monitoring and alerts
7. 🔜 Optimize performance (caching, etc.)
