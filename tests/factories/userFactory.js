const userFactory = {
  build: (overrides = {}) => ({
    email: 'test@example.com',
    password_hash: '$2b$10$test',
    name: 'Test User',
    ...overrides
  }),

  create: async (client, overrides = {}) => {
    const data = userFactory.build(overrides);

    const result = await client.query(`
      INSERT INTO users (email, password_hash, name, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [data.email, data.password_hash, data.name]);

    return result.rows[0];
  }
};

module.exports = { userFactory };
