#!/bin/bash
set -e

echo "🚀 Setting up Investment Tracker development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to environment directory
cd "$(dirname "$0")/.."

echo "📦 Starting PostgreSQL container..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
# Wait for PostgreSQL to be healthy
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U dev_user -d investment_tracker_dev > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ PostgreSQL failed to start within 30 attempts"
        docker-compose logs postgres
        exit 1
    fi
    
    echo "   Attempt $attempt/$max_attempts - waiting..."
    sleep 2
    ((attempt++))
done

echo "🔍 Verifying database setup..."

# Check if database exists and has data
result=$(docker-compose exec -T postgres psql -U dev_user -d investment_tracker_dev -t -c "
    SELECT COUNT(*) FROM users;
" 2>/dev/null || echo "0")

user_count=$(echo $result | xargs)

if [ "$user_count" -gt "0" ]; then
    echo "✅ Database schema and seed data loaded successfully!"
    echo "   Found $user_count test users"
else
    echo "❌ Database setup may have failed - no users found"
    exit 1
fi

echo "📊 Database status:"
docker-compose exec -T postgres psql -U dev_user -d investment_tracker_dev -c "
    SELECT 
        'Users' as table_name, COUNT(*) as count FROM users
    UNION ALL
    SELECT 
        'Portfolios' as table_name, COUNT(*) as count FROM portfolios  
    UNION ALL
    SELECT 
        'Investments' as table_name, COUNT(*) as count FROM investments
    UNION ALL
    SELECT 
        'Transactions' as table_name, COUNT(*) as count FROM transactions;
"

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "📝 Connection details:"
echo "   Host: localhost"
echo "   Port: 5432" 
echo "   Database: investment_tracker_dev"
echo "   User: dev_user"
echo "   Password: dev_password"
echo ""
echo "🧪 Run tests with:"
echo "   cd tests && npm test"
echo ""
echo "🛑 Stop environment with:"
echo "   docker-compose down"
