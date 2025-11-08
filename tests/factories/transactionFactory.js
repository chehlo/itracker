const transactionFactory = {
  build: (overrides = {}) => ({
    type: 'buy',
    amount: 1000.00,
    currency: 'USD',
    transaction_date: '2024-01-01',
    ...overrides
  }),

  create: async (client, overrides = {}) => {
    const data = transactionFactory.build(overrides);

    if (!data.investment_id) {
      throw new Error('transactionFactory.create requires investment_id');
    }

    const result = await client.query(`
      INSERT INTO transactions (
        investment_id,
        type,
        amount,
        currency,
        transaction_date,
        quantity,
        price,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [
      data.investment_id,
      data.type,
      data.amount,
      data.currency,
      data.transaction_date,
      data.quantity || null,
      data.price || null
    ]);

    return result.rows[0];
  }
};

module.exports = { transactionFactory };
