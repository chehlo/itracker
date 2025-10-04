process.env.NODE_ENV = 'test';
const request = require('../../backend/node_modules/supertest');
const app = require('../../backend/src/app.js');
const { clearTestDatabase,  closeTestConnections } = require('../helpers/database-config');

const pool = require('../../backend/src/config/database');

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);
});

beforeEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await closeTestConnections();
});

describe('Authentication Endpoints', () => {
const userData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

// add invalid user data for negative tests
const invalidUserData = {
  email: 'invalidemail',
  password: 'short',
  name: ''
};

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user.name).toBe(userData.name);
  });

  it('should not register with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email, password: userData.password });
    expect(res.statusCode).toEqual(400);
  });

  it('should not register duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res.statusCode).toEqual(409);
  });

  // security validation tests 
  it ('should reject passwords that are shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email, password: invalidUserData.password, name: 'Test User' });
    expect(res.statusCode).toEqual(400);
  });

  it ('should accept password with exactly 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email, password: '123456', name: 'Test User' });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(userData.email);
    expect(res.body.user.name).toBe(userData.name);
  });

  it ('should reject invalid email formats', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'invalidemail', password: 'validPassword123', name: 'Test User' });
    expect(res.statusCode).toEqual(400);
  });

  it ('should safely handle SQL injection attempts in email field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email + "'; DROP TABLE users; --", password: 'validPassword123', name: 'Test User' });
    expect(res.statusCode).toEqual(400); // Assuming the server responds with 400 for invalid email
    // Verify that the users table still exists by attempting to register a valid user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res2.statusCode).toEqual(201);
    expect(res2.body).toHaveProperty('token');
  });

  it ('should safely handle SQL injection attempts in name field', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: userData.email, password: userData.password, name: "Test User'; DROP TABLE users; --" });
    expect(res.statusCode).toEqual(400);
    // Verify that the users table still exists by attempting to register a valid user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res2.statusCode).toEqual(201);
    expect(res2.body).toHaveProperty('token');
  });

  it ('should safely handle special characters in fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: "/r/n/t'<>?;:[]{}|`~!@#$%^&*()-_=+\\", password: userData.password, name: 'Test User' });
    expect(res.statusCode).toEqual(400); // Assuming the server responds with 400 for invalid email
    // Verify that the users table still exists by attempting to register a valid user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send(userData);
    expect(res2.statusCode).toEqual(201);
    expect(res2.body).toHaveProperty('token');
  }); 

});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.name).toBe(userData.name);
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
    });

    it('should not login non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wronguser@mail.com', password: 'password123' });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      token = res.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.email).toBe(userData.email);
      expect(res.body.name).toBe(userData.name);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/profile');
      expect(res.statusCode).toEqual(401);
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.statusCode).toEqual(401);
    });
  });
});

