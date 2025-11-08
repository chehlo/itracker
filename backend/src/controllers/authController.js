const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const register = async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserQuery = 'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name';
    const newUserValues = [email, hashedPassword, name];

    const result = await db.query(newUserQuery, newUserValues);
    const newUser = result.rows[0];

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ message: 'Email already in use' });
    }
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    } 

    const user = userCheck.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    } 

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userQuery = 'SELECT id, email, name FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  register,
  login,
  getProfile
};
