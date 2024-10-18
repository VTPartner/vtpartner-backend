const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment-specific configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Function to execute a SELECT query
async function selectQuery(query, params = []) {
  try {
    console.log("Select_Query::=>", query);
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error("No Data Found");
    }
    
    return result.rows;
  } catch (err) {
    if (err.message === "No Data Found") {
      console.error("Error: No Data Found");
    } else {
      console.error("Error executing query", err.stack);
    }
    throw err; // Re-throw the error to be handled by the calling function
  }
}

// Function to execute an INSERT query
async function insertQuery(query, params) {
  try {
    console.log("Insert Query::=>",query);
    const result = await pool.query(query, params);
    if (result.rowCount === 0) {
      throw new Error("Insert operation failed");
    }
    return result.rowCount; // Returns the number of rows affected
  } catch (err) {
    if (err.message === 'Insert operation failed') {
      console.error('Error: Failed to insert data');
    } else {
      console.error('Error executing query', err.stack);
    }
    throw err; // Re-throw the error to be handled by the calling function
  }
}

// Function to execute an UPDATE query
async function updateQuery(query, params) {
  try {
    console.log("Update Query::=>",query);
    const result = await pool.query(query, params);
    if (result.rowCount === 0) {
      throw new Error('Update operation failed or no rows affected');
    }
    return result.rowCount; // Returns the number of rows affected
  } catch (err) {
    if (err.message === 'Update operation failed or no rows affected') {
      console.error('Error: Failed to update data or no matching rows');
    } else {
      console.error('Error executing query', err.stack);
    }
    throw err; // Re-throw the error to be handled by the calling function
  }
}

module.exports = {
  selectQuery,
  insertQuery,
  updateQuery,
};
