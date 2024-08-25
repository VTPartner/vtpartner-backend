const express = require('express');
const db = require('./db'); // Import the database functions

const app = express();

app.get('/api/', async (req, res) => {
  try {
    const result = await db.selectQuery('SELECT NOW()');
    res.send(result[0]);
    console.log("Data Loaded Successfully");
  } catch (err) {
    if (err.message === 'No data found') {
      res.status(404).send('No data found');
    } else {
      res.status(500).send('An error occurred while processing your request');
    }
  }
});

// Similar error handling can be added to POST and PUT routes
app.post('/api/insert', async (req, res) => {
    try {
      const query = 'INSERT INTO demo_tbl(demo_name, demo_age) VALUES($1, $2)';
      const values = [req.body.demo_name, req.body.demo_age];
      const rowCount = await db.insertQuery(query, values);
      res.send(`${rowCount} rows inserted`);
    } catch (err) {
      console.error('Error executing INSERT query', err.stack);
      res.status(500).send('Error executing INSERT query');
    }
  });
  
  app.put('/api/update', async (req, res) => {
    try {
      const query = 'UPDATE demo_tbl SET demo_name = $1 WHERE demo_age = $2';
      const values = [req.body.demo_name, req.body.demo_age];
      const rowCount = await db.updateQuery(query, values);
      res.send(`${rowCount} rows updated`);
    } catch (err) {
      console.error('Error executing UPDATE query', err.stack);
      res.status(500).send('Error executing UPDATE query');
    }
  });

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
