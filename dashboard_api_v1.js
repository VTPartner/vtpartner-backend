// dashboard_api_v1.js
const express = require("express");
const jwt = require("jsonwebtoken"); // for generating tokens
const db = require("./db"); // Import the database functions


const router = express.Router();

//To Handle Query Errors
const handleError = (res, err) => {
  console.error("Error executing query", err.stack);
  if (err.message === "No Data Found") {
    sendResponse(res, 404, null, "No Data Found");
  } else {
    sendResponse(res, 500, null, "Internal Server Error");
  }
};

//Generic Response Function
const sendResponse = (res, statusCode, data = null, message = null) => {
  res.status(statusCode).send({
    success: statusCode < 400,
    message: message || (data ? "Request successful" : "No data found"),
    data,
  });
};

// Utility function to validate required fields
const checkMissingFields = (requiredFields) => {
  const missingFields = Object.keys(requiredFields).filter(
    (field) =>
      requiredFields[field] === undefined ||
      requiredFields[field] === null ||
      requiredFields[field] === ""
  );
  
  // Return missing fields if any, otherwise return null
  return missingFields.length > 0 ? missingFields : null;
};


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
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/all_branches", verifyToken, async (req, res) => {
  const { admin_id } = req.body;

  try {
    const result = await db.selectQuery(
      "select branchtbl.branch_id,branch_name,location,city_id,branchtbl.reg_date,creation_time,branch_status from vtpartner.branchtbl,vtpartner.admintbl where admintbl.branch_id=branchtbl.branch_id and admin_id=$1",
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

router.post("/all_allowed_cities", verifyToken, async (req, res) => {
  const { city_id } = req.body;

  try {
    const result = await db.selectQuery(
      "select city_id,city_name,pincode,bg_image,time,pincode_until,description,status from vtpartner.available_citys_tbl order by city_id desc"
      // [admin_id]
    );

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    
    res.status(200).send({
      cities: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/update_allowed_city", verifyToken, async (req, res) => {
  try {
    const {
      city_id,
      city_name,
      pincode,
      pincode_until,
      description,
      bg_image,
      status,
    } = req.body;
    console.log("Update query Body::", req.body);
    // List of required fields
    const requiredFields = {
      city_id,
      city_name,
      pincode,
      pincode_until,
      description,
      bg_image,
      status,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const query =
      "UPDATE vtpartner.available_citys_tbl SET city_name = $1, pincode = $2, bg_image = $3, pincode_until = $4, description = $5, time = EXTRACT(EPOCH FROM CURRENT_TIMESTAMP), status=$6 WHERE city_id = $7";
    const values = [
      city_name,
      pincode,
      bg_image,
      pincode_until,
      description,
      status,
      city_id,
    ];
    const rowCount = await db.updateQuery(query, values);
    res.send(`${rowCount} rows updated`);
  } catch (err) {
    console.error("Error executing allowed city UPDATE query", err.stack);
    res.status(500).send("Error executing allowed city UPDATE query");
  }
});

router.post("/add_new_allowed_city", verifyToken, async (req, res) => {
  try {
    const { city_name, pincode, pincode_until, description, bg_image } =
      req.body;

    // List of required fields
    const requiredFields = {
      city_name,
      pincode,
      pincode_until,
      description,
      bg_image,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const query =
      "INSERT INTO vtpartner.available_citys_tbl (city_name,pincode,bg_image,pincode_until,description) VALUES ($1,$2,$3,$4,$5)";
    const values = [city_name, pincode, bg_image, pincode_until, description];
    const rowCount = await db.insertQuery(query, values);
    res.send(`${rowCount} rows inserted`);
  } catch (err) {
    console.error("Error executing add new allowed city query", err.stack);
    res.status(500).send("Error executing add new allowed city query");
  }
});

router.post("/all_allowed_pincodes", verifyToken, async (req, res) => {
  const { city_id } = req.body;

  try {
    const query =
      "select pincode_id,allowed_pincodes_tbl.pincode,creation_time,allowed_pincodes_tbl.status from vtpartner.allowed_pincodes_tbl,vtpartner.available_citys_tbl where available_citys_tbl.city_id=allowed_pincodes_tbl.city_id and allowed_pincodes_tbl.city_id=$1 order by pincode_id desc";
    const values = [city_id];
    console.log("query==>", query);
    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      pincodes: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_new_pincode", verifyToken, async (req, res) => {
  try {
    const { city_id, pincode, pincode_status } = req.body;

    // List of required fields
    const requiredFields = {
      city_id,
      pincode,
      pincode_status,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const duplicateCheckQuery =
      "SELECT COUNT(*) FROM vtpartner.allowed_pincodes_tbl WHERE pincode ILIKE $1 ";
    const duplicateCheckQueryValues = [pincode];

    const query =
      "INSERT INTO vtpartner.allowed_pincodes_tbl (pincode,city_id,status) VALUES ($1,$2,$3)";
    const values = [pincode, city_id, pincode_status];
    const rowCount = await db.insertQuery(query, values);
    res.send(`${rowCount} rows inserted`);
  } catch (err) {
    console.error("Error executing add new allowed pincodes query", err.stack);
    res.status(500).send("Error executing add new allowed pincodes query");
  }
});

router.post("/edit_pincode", verifyToken, async (req, res) => {
  try {
    const { city_id, pincode, pincode_status, pincode_id } = req.body;

    // List of required fields
    const requiredFields = {
      city_id,
      pincode,
      pincode_status,
      pincode_id,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      console.log(`Missing required fields: ${missingFields.join(", ")}`);
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const query =
      "UPDATE vtpartner.allowed_pincodes_tbl set pincode = $1,city_id =$2, status= $3 where pincode_id= $4";
    const values = [pincode, city_id, pincode_status, pincode_id];
    const rowCount = await db.updateQuery(query, values);
    res.send(`${rowCount} rows inserted`);
  } catch (err) {
    console.error("Error executing updating allowed pincodes query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});



  


module.exports = router;
