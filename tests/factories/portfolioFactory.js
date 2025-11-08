const portfolioFactory = {
  build: (overrides = {}) => ({
    name: 'Test Portfolio',
    description: 'Test portfolio for testing',
    currency: 'USD',
    ...overrides
  }),

  create: async (client, overrides = {}) => {
    const data = portfolioFactory.build(overrides);

    if (!data.user_id) {
      throw new Error('portfolioFactory.create requires user_id');
    }

    const result = await client.query(`
      INSERT INTO portfolios (name, description, user_id, currency, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [data.name, data.description, data.user_id, data.currency]);

    return result.rows[0];
  }
};

module.exports = { portfolioFactory };
