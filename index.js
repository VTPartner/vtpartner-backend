const express = require('express');
const bodyParser = require("body-parser");
const dashboardApiV1 = require("./dashboard_api_v1"); // Import the dashboard API routes

const app = express();
app.use(bodyParser.json()); // To parse JSON bodies

// Use the dashboard API routes under /api/v1/dashboard
app.use("/api/v1/dashboard", dashboardApiV1);



app.get('/api/', async (req, res) => {
    try {
      const result = await db.selectQuery('SELECT demoid, demo_name, demo_age FROM demo_tbl');
  
      // Transform the result to use custom keys
      if (result.length === 0) {
        res.status(404).send({ message: 'No data found' });
      } else {
        const transformedResult = result.map(item => ({
          id: item.demoid,
          name: item.demo_name,
          age: item.demo_age
        }));
  
        res.status(200).send({ data: transformedResult });
      }
      
    } catch (err) {
      console.error('Error executing query', err.stack);
      res.status(500).send({ message: 'An error occurred while processing your request' });
    }
  });

app.post("/api/insert", async (req, res) => {
  try {
    const { demo_name, demo_age } = req.body;

    if (!demo_name || demo_age === undefined) {
      return res
        .status(400)
        .send("Missing required fields: demo_name or demo_age");
    }

    const query = "INSERT INTO demo_tbl(demo_name, demo_age) VALUES($1, $2)";
    const values = [demo_name, demo_age];
    const rowCount = await db.insertQuery(query, values);
    res.send(`${rowCount} rows inserted`);
  } catch (err) {
    console.error("Error executing INSERT query", err.stack);
    res.status(500).send("Error executing INSERT query");
  }
});

app.put("/api/update", async (req, res) => {
  try {
    const { demo_name, demo_age } = req.body;

    if (!demo_name || demo_age === undefined) {
      return res
        .status(400)
        .send("Missing required fields: demo_name or demo_age");
    }

    const query = "UPDATE demo_tbl SET demo_name = $1 WHERE demo_age = $2";
    const values = [demo_name, demo_age];
    const rowCount = await db.updateQuery(query, values);
    res.send(`${rowCount} rows updated`);
  } catch (err) {
    console.error("Error executing UPDATE query", err.stack);
    res.status(500).send("Error executing UPDATE query");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
