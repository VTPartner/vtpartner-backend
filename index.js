const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment-specific configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const app = express();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


app.get('/api/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    // console.log(`Result::${result.rows[0]}`);
    res.send(result.rows[0]);
  } catch (err) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Error executing query');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

