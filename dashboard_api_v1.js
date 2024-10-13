// dashboard_api_v1.js
const express = require("express");
const jwt = require("jsonwebtoken"); // for generating tokens
const db = require("./db"); // Import the database functions

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.selectQuery(
      "SELECT admin_id, admin_name, email, password FROM vtpartner.admintbl WHERE email = $1 and password = $2",
      [email, password]
    );

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    const user = result[0];

    // Generate a token using JWT
    const token = jwt.sign(
      { admin_id: user.admin_id, admin_name: user.admin_name },
      "your_jwt_secret",
      { expiresIn: "1d" }
    );

    // Return the token and user details
    res.status(200).send({
      token,
      user: {
        id: user.admin_id,
        role: user.admin_role,
        name: user.admin_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    //console.log("err.stack.message::::", err.message);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "An error occurred" });
  }
});

router.post("/all-branches", verifyToken, async (req, res) => {
  const { admin_id, auth } = req.body;

  try {
    const result = await db.selectQuery(
      "select branchtbl.branch_id,branch_name,location,city_id,branchtbl.reg_date,creation_time from vtpartner.branchtbl,vtpartner.admintbl where admintbl.branch_id=branchtbl.branch_id and admin_id=$1",
      [admin_id]
    );

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    // Return user branch data
    res.status(200).send({
      branches: result, // Send the array of branches
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    //console.log("err.stack.message::::", err.message);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "An error occurred" });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token is sent in the Authorization header

  if (!token) return res.status(403).send({ message: "Token is missing" });

  try {
    // Verify the token using the same secret used during token generation
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded; // Attach decoded user info (e.g., admin_id, admin_name) to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).send({ message: "Invalid token" });
  }
};
  

module.exports = router;
