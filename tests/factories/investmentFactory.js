const investmentFactory = {
  build: (overrides = {}) => ({
    name: 'Test Investment',
    type: 'public_market',
    symbol: 'TEST',
    base_currency: 'USD',
    ...overrides
  }),

  create: async (client, overrides = {}) => {
    const data = investmentFactory.build(overrides);

    if (!data.portfolio_id) {
      throw new Error('investmentFactory.create requires portfolio_id');
    }

    const result = await client.query(`
      INSERT INTO investments (
        name,
        type,
        symbol,
        portfolio_id,
        base_currency,
        commitment_amount,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [
      data.name,
      data.type,
      data.symbol,
      data.portfolio_id,
      data.base_currency,
      data.commitment_amount || null
    ]);

    return result.rows[0];
  }
};

module.exports = { investmentFactory };
