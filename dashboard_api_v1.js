// dashboard_api_v1.js
const express = require("express");
const jwt = require("jsonwebtoken"); // for generating tokens
const db = require("./db"); // Import the database functions

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.selectQuery(
      "SELECT admin_id, admin_name, gmail, password FROM vtpartner.admintbl WHERE gmail = $1 and password = $2",
      [email, password]
    );

    if (result.length === 0) {
      return res.status(404).send({ message: "User not found" });
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
        admin_id: user.admin_id,
        admin_name: user.admin_name,
        email: user.gmail,
      },
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    res.status(500).send({ message: "An error occurred" });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assuming Bearer token is sent
  if (!token) return res.status(403).send({ message: "Token is missing" });

  try {
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid token" });
  }
};

module.exports = router;
