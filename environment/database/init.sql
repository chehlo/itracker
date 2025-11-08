-- Investment Tracker Database Schema
-- PostgreSQL 15+ compatible

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for portfolio queries
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_active ON portfolios(is_active);

-- Investment types enum
CREATE TYPE investment_type AS ENUM (
    'public_market',
    'alternative',
    'recurring',
    'private_equity'
);

-- Investments table
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type investment_type NOT NULL,
    symbol VARCHAR(50),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,

    -- Currency information
    base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exposure_currency VARCHAR(3),

    -- Current value (for manual updates)
    current_value DECIMAL(15,2),
    last_price DECIMAL(15,6),
    last_price_date TIMESTAMP WITH TIME ZONE,

    -- Private equity specific fields
    commitment_amount DECIMAL(15,2),
    total_invested DECIMAL(15,2) DEFAULT 0,
    total_distributions DECIMAL(15,2) DEFAULT 0,
    expected_completion_date DATE,

    -- Metadata
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for investment queries
CREATE INDEX idx_investments_portfolio_id ON investments(portfolio_id);
CREATE INDEX idx_investments_type ON investments(type);
CREATE INDEX idx_investments_symbol ON investments(symbol);
CREATE INDEX idx_investments_active ON investments(is_active);

-- Transaction types enum
CREATE TYPE transaction_type AS ENUM (
    'buy',
    'sell',
    'dividend',
    'contribution',
    'capital_call',
    'distribution',
    'value_update'
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,

    -- Transaction details
    quantity DECIMAL(15,6),
    price DECIMAL(15,6),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,

    -- Transaction date and exchange rate
    transaction_date DATE NOT NULL,
    exchange_rate DECIMAL(10,6) DEFAULT 1.0,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for transaction queries
CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some constraints for data integrity
ALTER TABLE investments ADD CONSTRAINT check_private_equity_fields
    CHECK (
        (type != 'private_equity') OR
        (type = 'private_equity' AND commitment_amount IS NOT NULL)
    );

ALTER TABLE transactions ADD CONSTRAINT check_amount_positive
    CHECK (amount > 0);

-- Success message
SELECT 'Database schema created successfully!' as result;
