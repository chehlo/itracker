require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Investment Tracker API is running' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const db = require('./config/database');
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ time: result.rows[0] });
  } catch (err) {
    console.error('Database query error', err.stack);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
