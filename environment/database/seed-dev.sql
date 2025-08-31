-- Development seed data for Investment Tracker
-- This data is loaded after schema creation

-- Insert test user
INSERT INTO users (id, email, name, google_id) VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'test@example.com',
    'Test User',
    'google_123456789'
);

-- Insert test portfolio
INSERT INTO portfolios (id, name, description, user_id, currency) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'Main Portfolio',
    'Primary investment portfolio for testing',
    '550e8400-e29b-41d4-a716-446655440000',
    'USD'
);

-- Insert test investments (different types)
INSERT INTO investments (id, name, type, symbol, portfolio_id, base_currency, exposure_currency, current_value, last_price, last_price_date, commitment_amount, total_invested, total_distributions, expected_completion_date) VALUES
-- Public market investments
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Apple Inc',
    'public_market',
    'AAPL',
    '550e8400-e29b-41d4-a716-446655440001',
    'USD',
    'USD',
    15000.00,
    150.00,
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    NULL,
    NULL
),

(
    '550e8400-e29b-41d4-a716-446655440003',
    'SPDR S&P 500 ETF',
    'public_market',
    'SPY',
    '550e8400-e29b-41d4-a716-446655440001',
    'USD',
    'USD',
    25000.00,
    420.50,
    NOW() - INTERVAL '2 hours',
    NULL,
    NULL,
    NULL,
    NULL
),

-- Alternative investment
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Real Estate Investment',
    'alternative',
    NULL,
    '550e8400-e29b-41d4-a716-446655440001',
    'USD',
    'USD',
    50000.00,
    NULL,
    NOW() - INTERVAL '30 days',
    NULL,
    NULL,
    NULL,
    NULL
),

-- Recurring investment
(
    '550e8400-e29b-41d4-a716-446655440005',
    '401k Contributions',
    'recurring',
    NULL,
    '550e8400-e29b-41d4-a716-446655440001',
    'USD',
    'USD',
    12000.00,
    NULL,
    NOW() - INTERVAL '7 days',
    NULL,
    NULL,
    NULL,
    NULL
),

-- Private equity investment
(
    '550e8400-e29b-41d4-a716-446655440006',
    'Tech Startup Fund',
    'private_equity',
    NULL,
    '550e8400-e29b-41d4-a716-446655440001',
    'USD',
    'USD',
    NULL,
    NULL,
    NULL,
    100000.00, -- commitment_amount
    30000.00,  -- total_invested
    2000.00,   -- total_distributions
    '2029-12-31' -- expected_completion_date
);

-- Insert sample transactions
INSERT INTO transactions (investment_id, type, quantity, price, amount, currency, transaction_date, notes) VALUES

-- Apple stock transactions
(
    '550e8400-e29b-41d4-a716-446655440002',
    'buy',
    100.00,
    145.00,
    14500.00,
    'USD',
    '2024-01-15',
    'Initial Apple stock purchase'
),

(
    '550e8400-e29b-41d4-a716-446655440002',
    'dividend',
    100.00,
    0.25,
    25.00,
    'USD',
    '2024-02-15',
    'Q1 dividend payment'
),

-- SPY ETF transactions
(
    '550e8400-e29b-41d4-a716-446655440003',
    'buy',
    60.00,
    415.00,
    24900.00,
    'USD',
    '2024-01-20',
    'SPY ETF purchase'
),

-- Real estate transaction
(
    '550e8400-e29b-41d4-a716-446655440004',
    'value_update',
    NULL,
    NULL,
    50000.00,
    'USD',
    '2024-08-01',
    'Updated property valuation'
),

-- 401k contributions
(
    '550e8400-e29b-41d4-a716-446655440005',
    'contribution',
    NULL,
    NULL,
    2000.00,
    'USD',
    '2024-08-01',
    'Monthly 401k contribution'
),

(
    '550e8400-e29b-41d4-a716-446655440005',
    'contribution',
    NULL,
    NULL,
    2000.00,
    'USD',
    '2024-07-01',
    'Monthly 401k contribution'
),

-- Private equity transactions
(
    '550e8400-e29b-41d4-a716-446655440006',
    'capital_call',
    NULL,
    NULL,
    15000.00,
    'USD',
    '2024-03-15',
    'First capital call - 15% of commitment'
),

(
    '550e8400-e29b-41d4-a716-446655440006',
    'capital_call',
    NULL,
    NULL,
    15000.00,
    'USD',
    '2024-06-15',
    'Second capital call - 15% of commitment'
),

(
    '550e8400-e29b-41d4-a716-446655440006',
    'distribution',
    NULL,
    NULL,
    2000.00,
    'USD',
    '2024-08-01',
    'Early distribution from portfolio company exit'
);

-- Verify data insertion
SELECT 'Development seed data loaded successfully!' as result;
SELECT
    u.name as user_name,
    p.name as portfolio_name,
    COUNT(i.id) as investment_count,
    COUNT(t.id) as transaction_count
FROM users u
LEFT JOIN portfolios p ON u.id = p.user_id
LEFT JOIN investments i ON p.id = i.portfolio_id
LEFT JOIN transactions t ON i.id = t.investment_id
GROUP BY u.id, u.name, p.id, p.name;
