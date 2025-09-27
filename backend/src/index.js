// Convert to simple server startup file. Requirements:
//- Import app from './app.js'
//- Keep PORT configuration
// - Only handle app.listen() call
//- Remove all middleware and route definitions
// - Minimal server startup Onl
// - Keep environment variable loading

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
