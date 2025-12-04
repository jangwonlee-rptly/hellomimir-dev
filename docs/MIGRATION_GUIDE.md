# Backend Migration Guide

This document describes the migration from Next.js monolithic architecture to a separated frontend + backend architecture.

## Architecture Changes

### Before (Monolithic Next.js)
```
Next.js App
├── Frontend (React pages)
├── API Routes (cron, fields, etc.)
├── Backend Services (arXiv, LLM, Supabase)
└── PDF extraction attempts (failed due to Node.js limitations)
```

### After (Separated Architecture)
```
Next.js Frontend
├── React pages (UI)
├── Supabase client (read-only, anon key)
└── Thin proxy routes (forwards to backend)

Python FastAPI Backend
├── arXiv client
├── LLM generation (OpenAI)
├── Supabase client (service role)
├── Ingestion orchestration
└── Future: PDF extraction with proper tools
```

## What Changed

### Next.js (Frontend)

**Removed:**
- Direct arXiv API calls (`src/lib/arxivClient.ts` - still exists but unused)
- Direct OpenAI calls (`src/lib/llmClient.ts` - still exists but unused)
- Direct Supabase writes (`src/lib/supabaseClient.ts` - now read-only)
- Daily paper ingestion logic (`src/lib/dailyPaperService.ts` - still exists but unused)
- PDF extraction attempts (no longer needed here)

**Changed:**
- Cron endpoint now proxies to FastAPI backend
- Environment variables simplified (see `.env.local.example`)
- Supabase client should use anon key for frontend (not service role)

**Still Present:**
- All frontend pages and components
- Reading from Supabase (papers, summaries, quizzes)
- PDF extraction code (deprecated, will be removed)

### New FastAPI Backend

**Added:**
- `backend/` - Complete Python backend
- arXiv service with rate limiting
- LLM service for summaries, quizzes, pre-reading
- Supabase client for database operations
- Paper ingestion orchestration
- RESTful API endpoints
- Docker support

## Migration Steps

### 1. Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Required:
#   - SUPABASE_URL
#   - SUPABASE_SERVICE_ROLE_KEY
#   - OPENAI_API_KEY
#   - CRON_SECRET

# Install dependencies (for local development)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run backend locally
uvicorn app.main:app --reload --port 8000

# OR run with Docker
docker build -t hellomimir-backend .
docker run -p 8000:8000 --env-file .env hellomimir-backend
```

### 2. Update Next.js Configuration

```bash
# In project root
# Update .env.local with new variables

# Add BACKEND_API_URL
echo "BACKEND_API_URL=http://localhost:8000" >> .env.local

# Update Supabase to use anon key for frontend
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Remove service role key and API keys from Next.js .env
# (They're now only needed in backend/.env)
```

### 3. Test the Integration

```bash
# Terminal 1: Run backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Run frontend
npm run dev

# Terminal 3: Test ingestion
curl -X POST http://localhost:3000/api/cron/daily-papers \
  -H "X-Cron-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'
```

### 4. Deploy Both Services

**Option A: Separate Deployments**
- Deploy Next.js to Vercel/Netlify
- Deploy FastAPI to Railway/Fly.io/DigitalOcean
- Update `BACKEND_API_URL` in Next.js to point to deployed backend

**Option B: Docker Compose**
```bash
# In project root (if you create a root docker-compose.yml)
docker-compose up -d
```

## Environment Variables

### Next.js (.env.local)
```bash
# Frontend (read-only Supabase access)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
BACKEND_API_URL=http://localhost:8000  # or https://your-backend.com

# Cron authentication
CRON_SECRET=your-secret
```

### FastAPI Backend (backend/.env)
```bash
# Database (write access)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
OPENAI_API_KEY=your-openai-key

# arXiv
ARXIV_BASE_URL=http://export.arxiv.org/api/query
ARXIV_RATE_LIMIT_SECONDS=3

# Authentication
CRON_SECRET=your-secret

# Optional
CLARIFAI_API_KEY=your-clarifai-key  # For future OCR
DEBUG=false
```

## API Endpoints

### FastAPI Backend (Internal Use)

**Health & Status:**
- `GET /health` - Simple health check
- `GET /internal/status` - Detailed status with DB connectivity

**Ingestion:**
- `POST /internal/papers/daily` - Run daily ingestion
  - Requires `X-Cron-Secret` header
  - Optional body: `{"date": "YYYY-MM-DD"}`

### Next.js (Public)

**Cron (proxies to backend):**
- `POST /api/cron/daily-papers` - Trigger daily ingestion
- `GET /api/cron/daily-papers?date=YYYY-MM-DD` - Trigger for specific date

**Other routes unchanged:**
- `GET /api/fields` - Get all fields
- `GET /api/field/[slug]/today` - Get today's paper
- `GET /api/field/[slug]/papers` - Get paper details
- `GET /api/field/[slug]/archive` - Get archive

## Testing the Migration

### 1. Backend Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

### 2. Backend Status Check
```bash
curl http://localhost:8000/internal/status
# Expected: Database connected, all services available
```

### 3. Ingestion Test
```bash
# Via backend directly
curl -X POST http://localhost:8000/internal/papers/daily \
  -H "X-Cron-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'

# Via Next.js proxy
curl -X POST http://localhost:3000/api/cron/daily-papers \
  -H "X-Cron-Secret: your-secret" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-12-04"}'
```

### 4. Frontend Display
Visit `http://localhost:3000/field/ai-ml` and verify:
- Paper displays correctly
- Summaries load
- Quiz works
- Pre-reading materials appear (if available)

## Rollback Plan

If issues occur, you can temporarily revert:

1. **Keep both services running**
2. **Point cron directly to Next.js internal logic** (revert cron route changes)
3. **Restore environment variables** in Next.js

The old code is still present in Next.js, just not used. You can revert the cron route to call `processAllFieldsForDate()` directly.

## Benefits of New Architecture

1. **Clean Separation of Concerns**
   - Frontend: UI and read-only data access
   - Backend: Business logic, AI, and data writes

2. **Better PDF Extraction Support**
   - Python has mature PDF libraries (pypdf, pdfplumber, poppler)
   - No Web Worker issues
   - Can use native system tools

3. **Scalability**
   - Backend can scale independently
   - Can add multiple workers
   - Easier to optimize performance

4. **Maintainability**
   - Clear boundaries between services
   - Easier to test backend logic
   - Better error handling and logging

5. **Future Features**
   - Full-text extraction with proper tools
   - Image-based OCR (DeepSeek/Clarifai)
   - Vector embeddings for semantic search
   - More complex AI pipelines

## Deprecation Timeline

### Immediately Deprecated (Not Used)
- `src/lib/arxivClient.ts` - Replaced by `backend/app/services/arxiv_service.py`
- `src/lib/llmClient.ts` - Replaced by `backend/app/services/llm_service.py`
- `src/lib/dailyPaperService.ts` - Replaced by `backend/app/services/paper_service.py`
- `src/lib/pdfExtractor.ts` - Failed approach, not used
- `src/lib/hybridPdfExtractor.ts` - Failed approach, not used
- `src/lib/deepseekClient.ts` - Never completed

### Can Be Removed (After Testing)
Once you've verified the migration works:
1. Delete unused lib files
2. Remove unnecessary dependencies from `package.json`
3. Clean up environment variables
4. Update Dockerfile to not include backend logic

## Support

If you encounter issues:
1. Check logs in both services
2. Verify environment variables are set correctly
3. Ensure database is accessible from both services
4. Test each service independently before integration

## Next Steps

After migration is complete:
1. Implement proper PDF extraction in Python backend
2. Add DeepSeek OCR integration
3. Set up automated deployment pipeline
4. Add monitoring and alerting
5. Implement caching layer if needed
