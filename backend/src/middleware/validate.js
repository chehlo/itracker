
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sqlInjectionPattern = /('|--|;|\/\*|\*\/|xp_|sp_|exec|execute|drop|delete|insert|update|create|alter|truncate)/i;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  if (sqlInjectionPattern.test(name)) {
    return res.status(400).json({ message: 'Invalid characters in name field' });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  } 
  next();
};

module.exports = {
  validateRegister,
  validateLogin
};
