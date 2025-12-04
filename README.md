# hellomimir

**Learn a paper a day** - A web application that brings you one academic paper per field per day, explained at your reading level.

## Overview

hellomimir fetches papers from arXiv, generates reading-level-appropriate summaries using an LLM, and provides quizzes to test your understanding. Users can choose from fields like AI & Machine Learning, Astrophysics, Mathematics, and more.

### Features

- **One paper per field per day**: Curated selection from arXiv
- **Three reading levels**: Grade 5, Middle School, and High School summaries
- **Interactive quizzes**: Test your understanding with multiple-choice questions
- **Mobile-first design**: Works great on phones and tablets
- **Archive access**: Browse previous days' papers

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (hosted Postgres)
- **APIs**: arXiv API, OpenAI API
- **Deployment**: Docker-ready for any container platform

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)
- OpenAI API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd hellomimir
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# arXiv API Base URL (optional)
ARXIV_BASE_URL=http://export.arxiv.org/api/query

# Cron endpoint secret
CRON_SECRET=your-secret-here
```

### 3. Set Up the Database

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy contents from supabase/migrations/001_initial_schema.sql
```

This creates all tables and seeds the initial fields.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Generate Daily Papers

Trigger the cron endpoint to fetch papers and generate summaries:

```bash
curl -X POST http://localhost:3000/api/cron/daily-papers \
  -H "x-cron-secret: your-secret-here"
```

Or with a specific date:

```bash
curl -X POST http://localhost:3000/api/cron/daily-papers \
  -H "x-cron-secret: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-01-15"}'
```

## Docker Deployment

### Build and Run Locally

```bash
# Build the image
docker build -t hellomimir .

# Run with environment variables
docker run -p 3000:3000 --env-file .env.local hellomimir
```

### Using Docker Compose

```bash
# Create .env file with your variables (same format as .env.local)
# Then run:
docker compose up --build
```

### Deploying to Production

The Docker image works with any container platform:

- **Fly.io**: `fly launch` and configure secrets
- **Render**: Connect your repo and set environment variables
- **AWS ECS**: Push to ECR and create a service
- **Google Cloud Run**: Push to GCR and deploy

## Cron Job Setup

The `/api/cron/daily-papers` endpoint should be called once daily to:

1. Fetch new papers from arXiv for each field
2. Generate summaries at all reading levels
3. Create quizzes for each paper

### Example Cron Configurations

**GitHub Actions** (`.github/workflows/daily-papers.yml`):

```yaml
name: Daily Paper Generation
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/daily-papers \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}"
```

**Supabase Edge Functions**: Create a scheduled function to call the endpoint.

**External cron service**: Use services like cron-job.org, EasyCron, or your cloud provider's scheduler.

## Project Structure

```
hellomimir/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── fields/        # List fields
│   │   │   ├── field/[slug]/  # Field-specific endpoints
│   │   │   └── cron/          # Cron job endpoint
│   │   ├── fields/            # Field selection page
│   │   └── field/[slug]/      # Paper viewing pages
│   ├── components/            # React components
│   ├── lib/                   # Server-side utilities
│   │   ├── supabaseClient.ts  # Database operations
│   │   ├── arxivClient.ts     # arXiv API client
│   │   ├── llmClient.ts       # OpenAI integration
│   │   └── dailyPaperService.ts
│   └── types/                 # TypeScript types
├── supabase/
│   └── migrations/            # SQL migrations
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## API Reference

### `GET /api/fields`

Returns all available fields.

### `GET /api/field/[slug]/today`

Returns today's paper for a field. Supports `?date=YYYY-MM-DD` for specific dates.

### `GET /api/field/[slug]/papers?date=YYYY-MM-DD`

Returns the paper for a specific date.

### `GET /api/field/[slug]/archive`

Returns all past papers for a field.

### `POST /api/cron/daily-papers`

Triggers paper generation for all fields. Requires `x-cron-secret` header.

## Database Schema

- **fields**: User-facing categories with arXiv query mappings
- **papers**: Unique arXiv papers
- **daily_papers**: One paper per field per date
- **paper_summaries**: Reading-level summaries
- **paper_quizzes**: Multiple-choice quizzes

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for generating summaries |
| `ARXIV_BASE_URL` | No | arXiv API base URL (default: http://export.arxiv.org/api/query) |
| `CRON_SECRET` | Yes | Secret for authenticating cron requests |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
