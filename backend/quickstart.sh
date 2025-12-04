#!/bin/bash
# Quick start script for hellomimir FastAPI backend

set -e

echo "========================================"
echo "hellomimir Backend Quick Start"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo ""
    echo "🔧 Please edit .env and add your credentials:"
    echo "   - SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - OPENAI_API_KEY"
    echo "   - CRON_SECRET"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if running in virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "📦 Setting up Python virtual environment..."

    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✓ Created virtual environment"
    fi

    echo ""
    echo "Activating virtual environment..."
    source venv/bin/activate
    echo "✓ Virtual environment activated"
fi

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt
echo "✓ Dependencies installed"

echo ""
echo "========================================"
echo "Starting FastAPI Backend..."
echo "========================================"
echo ""
echo "Backend will be available at:"
echo "  - API: http://localhost:8000"
echo "  - Docs: http://localhost:8000/docs"
echo "  - Health: http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Run uvicorn
uvicorn app.main:app --reload --port 8000
