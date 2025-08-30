#!/bin/bash

echo "🔍 Checking development environment prerequisites..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    echo "   Please start Docker Desktop and try again"
    exit 1
else
    echo "✅ Docker is running"
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not available"
    echo "   Please install docker-compose"
    exit 1
else
    echo "✅ docker-compose is available"
fi

# Navigate to environment directory
cd "$(dirname "$0")/.."

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml not found in $(pwd)"
    echo "   Please ensure you're running from the correct directory"
    exit 1
else
    echo "✅ docker-compose.yml found"
fi

# Check if database files exist
if [ ! -f "database/init.sql" ]; then
    echo "❌ database/init.sql not found"
    echo "   Database schema file is missing"
    exit 1
else
    echo "✅ Database schema file found"
fi

if [ ! -f "database/seed-dev.sql" ]; then
    echo "❌ database/seed-dev.sql not found"  
    echo "   Database seed file is missing"
    exit 1
else
    echo "✅ Database seed file found"
fi

echo ""
echo "🎉 All prerequisites are satisfied!"
echo ""
echo "Next steps:"
echo "1. Start environment: ./scripts/setup-dev.sh"
echo "2. Run tests: cd ../tests && npm test"
