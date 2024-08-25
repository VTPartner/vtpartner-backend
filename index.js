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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
