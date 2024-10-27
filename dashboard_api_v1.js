// dashboard_api_v1.js
const express = require("express");
const jwt = require("jsonwebtoken"); // for generating tokens
const db = require("./db"); // Import the database functions


const router = express.Router();
console.log("Entered Dashboard Api");

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
  console.log("token::", token);
  if (!token) return res.status(403).send({ message: "Token is missing" });

  try {
    // Verify the token using the same secret used during token generation
    const decoded = jwt.verify(token, "your_jwt_secret");
    req.user = decoded; // Attach decoded user info (e.g., admin_id, admin_name) to request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.log("errorToken::", error);
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.allowed_pincodes_tbl WHERE pincode ILIKE $1";
    const valuesDuplicateCheck = [pincode];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Pincode already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.allowed_pincodes_tbl (pincode, city_id, status) VALUES ($1, $2, $3)";
    const values = [pincode, city_id, pincode_status];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new allowed pincodes query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing add new allowed pincodes query" });
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
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.allowed_pincodes_tbl WHERE pincode ILIKE $1 AND city_id = $2 AND pincode_id != $3";
    const valuesDuplicateCheck = [pincode, city_id, pincode_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && parseInt(result[0].count) > 0) {
      return res.status(409).send({ message: "Pincode already exists" });
    }

    const query =
      "UPDATE vtpartner.allowed_pincodes_tbl SET pincode = $1, city_id = $2, status = $3 ,creation_time=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) WHERE pincode_id = $4";
    const values = [pincode, city_id, pincode_status, pincode_id];
    const rowCount = await db.updateQuery(query, values);

    // Check if any rows were updated
    if (rowCount > 0) {
      res.send(`${rowCount} row(s) updated`);
    } else {
      res.status(404).send({ message: "Pincode not found" });
    }
  } catch (err) {
    console.error("Error executing updating allowed pincodes query", err.stack);
    res.status(500).send("Internal Server Error");
  }
});


router.post("/service_types", verifyToken, async (req, res) => {
  try {
    const query =
      "select cat_type_id,category_type from vtpartner.category_type_tbl";
    const values = [];

    const result = await db.selectQuery(query);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      services_type_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/all_services", verifyToken, async (req, res) => {
  try {
    const query =
      "select category_id,category_name,category_type_id,category_image,category_type,epoch,description from vtpartner.categorytbl,vtpartner.category_type_tbl where category_type_tbl.cat_type_id=categorytbl.category_type_id order by category_id desc";
    const values = [];

    const result = await db.selectQuery(query);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      services_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_service", verifyToken, async (req, res) => {
  try {
    const { category_name, category_type_id, category_image, description } =
      req.body;

    // List of required fields
    const requiredFields = {
      category_name,
      category_type_id,
      category_image,
      description,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.categorytbl WHERE category_name ILIKE $1";
    const valuesDuplicateCheck = [category_name];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Service Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.categorytbl (category_name, category_type_id, category_image,description) VALUES ($1, $2, $3,$4)";
    const values = [
      category_name,
      category_type_id,
      category_image,
      description,
    ];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new category query", err.stack);
    res.status(500).send({ message: "Error executing add new category query" });
  }
});

router.post("/edit_service", verifyToken, async (req, res) => {
  try {
    const {
      category_id,
      category_name,
      category_type_id,
      category_image,
      description,
    } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
      category_name,
      category_type_id,
      category_image,
      description,
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.categorytbl WHERE category_name ILIKE $1 AND category_id!=$2";
    const valuesDuplicateCheck = [category_name, category_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Service Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "UPDATE vtpartner.categorytbl SET category_name=$1, category_type_id=$2, category_image=$3,epoch=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP),description=$4 where category_id=$5";
    const values = [
      category_name,
      category_type_id,
      category_image,
      description,
      category_id,
    ];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing updating category query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing updating category query" });
  }
});

router.post("/vehicle_types", verifyToken, async (req, res) => {
  try {
    const query =
      "select vehicle_type_id,vehicle_type_name from vtpartner.vehicle_types_tbl";
    const values = [];

    const result = await db.selectQuery(query);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      vehicle_type_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/all_vehicles", verifyToken, async (req, res) => {
  try {
    const { category_id } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
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
      "select vehicle_id,vehicle_name,weight,vehicle_types_tbl.vehicle_type_id,vehicle_types_tbl.vehicle_type_name,description,image,size_image from vtpartner.vehiclestbl,vtpartner.vehicle_types_tbl where vehiclestbl.vehicle_type_id=vehicle_types_tbl.vehicle_type_id and category_id=$1 order by vehicle_id desc";
    const values = [category_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      vehicle_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_vehicle", verifyToken, async (req, res) => {
  try {
    const {
      category_id,
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
    } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.vehiclestbl WHERE vehicle_name ILIKE $1";
    const valuesDuplicateCheck = [vehicle_name];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Vehicle Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.vehiclestbl (vehicle_name,weight,vehicle_type_id,description,image,size_image,category_id) VALUES ($1, $2, $3,$4,$5,$6,$7)";
    const values = [
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
      category_id,
    ];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new vehicle query", err.stack);
    res.status(500).send({ message: "Error executing add new vehicle query" });
  }
});

router.post("/edit_vehicle", verifyToken, async (req, res) => {
  try {
    const {
      category_id,
      vehicle_id,
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
    } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
      vehicle_id,
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.vehiclestbl WHERE vehicle_name ILIKE $1 AND vehicle_id !=$2";
    const valuesDuplicateCheck = [vehicle_name, vehicle_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Vehicle Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "UPDATE  vtpartner.vehiclestbl SET vehicle_name =$1,weight=$2,vehicle_type_id=$3,description=$4,image=$5,size_image =$6,category_id=$8 where vehicle_id=$7";
    const values = [
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
      vehicle_id,
      category_id,
    ];
    const rowCount = await db.updateQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing updating vehicle query", err.stack);
    res.status(500).send({ message: "Error executing updating vehicle query" });
  }
});

router.post("/vehicle_prices", verifyToken, async (req, res) => {
  try {
    const { vehicle_id } = req.body;

    // List of required fields
    const requiredFields = {
      vehicle_id,
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
      "select price_id,vehicle_city_wise_price_tbl.city_id,vehicle_city_wise_price_tbl.vehicle_id,starting_price_per_km,minimum_time,vehicle_city_wise_price_tbl.price_type_id,city_name,price_type,bg_image,time_created_at from vtpartner.available_citys_tbl,vtpartner.vehicle_city_wise_price_tbl,vtpartner.vehiclestbl,vtpartner.vehicle_price_type_tbl where vehicle_price_type_tbl.price_type_id=vehicle_city_wise_price_tbl.price_type_id and vehicle_city_wise_price_tbl.city_id=available_citys_tbl.city_id and vehicle_city_wise_price_tbl.vehicle_id=vehiclestbl.vehicle_id and vehicle_city_wise_price_tbl.vehicle_id=$1 order by city_name";
    const values = [vehicle_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      vehicle_price_details: result,
    });
  } catch (err) {
    console.error("Error executing vehicle_prices query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/vehicle_price_types", verifyToken, async (req, res) => {
  try {
    const query =
      "select price_type_id,price_type from vtpartner.vehicle_price_type_tbl";
    const values = [];

    const result = await db.selectQuery(query);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      vehicle_price_types: result,
    });
  } catch (err) {
    console.error("Error executing vehicle_price_types query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_vehicle_price", verifyToken, async (req, res) => {
  try {
    const {
      city_id,
      vehicle_id,
      starting_price_km,
      minimum_time,
      price_type_id,
    } = req.body;

    // List of required fields
    const requiredFields = {
      city_id,
      vehicle_id,
      starting_price_km,
      minimum_time,
      price_type_id,
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "select count(*) from vtpartner.available_citys_tbl,vtpartner.vehicle_city_wise_price_tbl where available_citys_tbl.city_id=vehicle_city_wise_price_tbl.city_id and available_citys_tbl.city_id=$1 and vehicle_id=$2 and price_type_id=$3";
    const valuesDuplicateCheck = [city_id, vehicle_id, price_type_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      console.log("City Name already exists");
      return res.status(409).send({ message: "City Name already exists" });
    }

    try {
      // Proceed to insert the new price since the resource wasn't found
      const query =
        "INSERT INTO vtpartner.vehicle_city_wise_price_tbl (city_id, vehicle_id, starting_price_per_km, minimum_time, price_type_id) VALUES ($1, $2, $3, $4, $5)";
      const values = [
        city_id,
        vehicle_id,
        starting_price_km,
        minimum_time,
        price_type_id,
      ];
      const rowCount = await db.insertQuery(query, values);

      // Send success response for insertion
      return res.status(200).send({ message: `${rowCount} row(s) inserted` });
    } catch (insertError) {
      console.error(
        "Error executing add new price to vehicle query",
        insertError.stack
      );
      return res
        .status(500)
        .send({ message: "Error executing add new price to vehicle query" });
    }
  } catch (err) {
    if (err.message.includes("No Data Found") || err.code === 404) {
      const {
        city_id,
        vehicle_id,
        starting_price_km,
        minimum_time,
        price_type_id,
      } = req.body;
      // Assuming 'not found' is part of your error message indicating a missing resource
      try {
        // Proceed to insert the new price since the resource wasn't found
        const query =
          "INSERT INTO vtpartner.vehicle_city_wise_price_tbl (city_id, vehicle_id, starting_price_per_km, minimum_time, price_type_id) VALUES ($1, $2, $3, $4, $5)";
        const values = [
          city_id,
          vehicle_id,
          starting_price_km,
          minimum_time,
          price_type_id,
        ];
        const rowCount = await db.insertQuery(query, values);

        // Send success response for insertion
        return res.status(200).send({ message: `${rowCount} row(s) inserted` });
      } catch (insertError) {
        console.error(
          "Error executing add new price to vehicle query",
          insertError.stack
        );
        return res
          .status(500)
          .send({ message: "Error executing add new price to vehicle query" });
      }
    }
    console.error("Error executing add new price to vehicle query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing add new price to vehicle query" });
  }
});

router.post("/edit_vehicle_price", verifyToken, async (req, res) => {
  try {
    const {
      price_id,
      city_id,
      vehicle_id,
      starting_price_km,
      minimum_time,
      price_type_id,
    } = req.body;

    // List of required fields
    const requiredFields = {
      city_id,
      vehicle_id,
      starting_price_km,
      minimum_time,
      price_type_id,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "select count(*) from vtpartner.available_citys_tbl,vtpartner.vehicle_city_wise_price_tbl where available_citys_tbl.city_id=vehicle_city_wise_price_tbl.city_id and available_citys_tbl.city_id=$1 and vehicle_id=$2 and price_id !=$3 and  price_type_id=$4";
    const valuesDuplicateCheck = [city_id, vehicle_id, price_id, price_type_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "City Name already exists" });
    }
    // If City ID is not duplicate, proceed to insert
    const query =
      "UPDATE vtpartner.vehicle_city_wise_price_tbl SET city_id=$1,vehicle_id=$2,starting_price_per_km=$3,minimum_time=$4,price_type_id=$5,time_created_at= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) where price_id=$6";
    const values = [
      city_id,
      vehicle_id,
      starting_price_km,
      minimum_time,
      price_type_id,
      price_id,
    ];
    const rowCount = await db.updateQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    try {
      if (err.message.includes("No Data Found") || err.code === 404) {
        console.log("Do Update here");
        const {
          price_id,
          city_id,
          vehicle_id,
          starting_price_km,
          minimum_time,
          price_type_id,
        } = req.body;
        // If City ID is not duplicate, proceed to insert
        const query =
          "UPDATE vtpartner.vehicle_city_wise_price_tbl SET city_id=$1,vehicle_id=$2,starting_price_per_km=$3,minimum_time=$4,price_type_id=$5,time_created_at= EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) where price_id=$6";
        const values = [
          city_id,
          vehicle_id,
          starting_price_km,
          minimum_time,
          price_type_id,
          price_id,
        ];
        const rowCount = await db.updateQuery(query, values);

        // Send success response
        res.status(200).send({ message: `${rowCount} row(s) inserted` });
      }
    } catch (error) {
      console.error(
        "Error executing updating price to vehicle query",
        err.stack
      );
      res
        .status(500)
        .send({ message: "Error executing loading price to vehicle query" });
    }

    console.error("Error executing loading price to vehicle query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing loading price to vehicle query" });
  }
});

//All Sub categories [ Electrician , plumber , JCb Driver ] against category_id 
router.post("/all_sub_categories", verifyToken, async (req, res) => {
  try {
    const { category_id } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
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
      "select sub_cat_id,sub_cat_name,cat_id,image,epoch_time from vtpartner.sub_categorytbl where cat_id=$1 order by sub_cat_id desc";
    const values = [category_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      sub_categories_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_sub_category", verifyToken, async (req, res) => {
  try {
    const { category_id, sub_cat_name, image } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
      sub_cat_name,
      image,
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.sub_categorytbl WHERE sub_cat_name ILIKE $1 AND cat_id=$2";
    const valuesDuplicateCheck = [sub_cat_name, category_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res
        .status(409)
        .send({ message: "Sub Category Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.sub_categorytbl (sub_cat_name,cat_id,image) VALUES ($1, $2, $3)";
    const values = [sub_cat_name, category_id, image];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new sub category query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing add new sub category query" });
  }
});

router.post("/edit_sub_category", verifyToken, async (req, res) => {
  try {
    const { category_id, sub_cat_id, sub_cat_name, image } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
      sub_cat_id,
      sub_cat_name,
      image,
    };

    // Use the utility function to check for missing fields
    const missingFields = checkMissingFields(requiredFields);

    // If there are missing fields, return an error response
    if (missingFields) {
      return res.status(400).send({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.sub_categorytbl WHERE sub_cat_name ILIKE $1 AND sub_cat_id !=$2";
    const valuesDuplicateCheck = [sub_cat_name, sub_cat_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res
        .status(409)
        .send({ message: "Sub Category Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "UPDATE  vtpartner.sub_categorytbl SET sub_cat_name=$1,cat_id=$2,image=$3,epoch_time=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) where sub_cat_id=$4";
    const values = [sub_cat_name, category_id, image, sub_cat_id];
    const rowCount = await db.updateQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing updating sub category query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing updating sub category query" });
  }
});

//Other Services [ WireMan,etc ]
router.post("/all_other_services", verifyToken, async (req, res) => {
  try {
    const { sub_cat_id } = req.body;

    // List of required fields
    const requiredFields = {
      sub_cat_id,
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
      "select service_id,service_name,sub_cat_id,service_image,time_updated from vtpartner.other_servicestbl where sub_cat_id=$1 order by sub_cat_id desc";
    const values = [sub_cat_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      other_services_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_other_service", verifyToken, async (req, res) => {
  try {
    const { service_name, sub_cat_id, service_image } = req.body;

    // List of required fields
    const requiredFields = {
      service_name,
      sub_cat_id,
      service_image,
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.other_servicestbl WHERE service_name ILIKE $1 AND sub_cat_id=$2";
    const valuesDuplicateCheck = [service_name, sub_cat_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Service Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.other_servicestbl (service_name,sub_cat_id,service_image) VALUES ($1, $2, $3)";
    const values = [service_name, sub_cat_id, service_image];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new other Service query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing add new other Service query" });
  }
});

router.post("/edit_other_service", verifyToken, async (req, res) => {
  try {
    const { service_id, service_name, sub_cat_id, service_image } = req.body;

    // List of required fields
    const requiredFields = {
      service_id,
      service_name,
      sub_cat_id,
      service_image,
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

    // Validating to avoid duplication
    const queryDuplicateCheck =
      "SELECT COUNT(*) FROM vtpartner.other_servicestbl WHERE service_name ILIKE $1 AND service_id !=$2";
    const valuesDuplicateCheck = [service_name, service_id];

    const result = await db.selectQuery(
      queryDuplicateCheck,
      valuesDuplicateCheck
    );

    // Check if the result is greater than 0 to determine if the pincode already exists
    if (result.length > 0 && result[0].count > 0) {
      return res.status(409).send({ message: "Service Name already exists" });
    }

    // If pincode is not duplicate, proceed to insert
    const query =
      "UPDATE  vtpartner.other_servicestbl SET service_name=$1,sub_cat_id=$2,service_image=$3,time_updated=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) where service_id=$4";
    const values = [service_name, sub_cat_id, service_image, service_id];
    const rowCount = await db.updateQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing updating other service query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing updating other service query" });
  }
});

//All Enquiries
//select enquiry_id,enquirytbl.category_id,enquirytbl.sub_cat_id,enquirytbl.service_id,enquirytbl.vehicle_id,enquirytbl.city_id,name,mobile_no,time_at,source_type,enquirytbl.status,category_name,sub_cat_name,service_name,city_name,vehicle_name from vtpartner.other_servicestbl,vtpartner.available_citys_tbl,vtpartner.vehiclestbl,vtpartner.sub_categorytbl,vtpartner.categorytbl,vtpartner.enquirytbl where enquirytbl.category_id=categorytbl.category_id and enquirytbl.sub_cat_id=sub_categorytbl.sub_cat_id  and enquirytbl.service_id=other_servicestbl.service_id and enquirytbl.vehicle_id=vehiclestbl.vehicle_id and enquirytbl.city_id=available_citys_tbl.city_id;
router.post("/all_enquiries", verifyToken, async (req, res) => {
  try {
    const { category_id } = req.body;

    // List of required fields
    const requiredFields = {
      category_id,
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
      "SELECT enquiry_id,enquirytbl.category_id, enquirytbl.sub_cat_id, enquirytbl.service_id,enquirytbl.vehicle_id, enquirytbl.city_id, name, mobile_no, time_at, source_type,enquirytbl.status, category_name, sub_cat_name, service_name, city_name, vehicle_name,enquirytbl.status FROM vtpartner.enquirytbl LEFT JOIN vtpartner.categorytbl ON enquirytbl.category_id = categorytbl.category_id LEFT JOIN vtpartner.sub_categorytbl ON enquirytbl.sub_cat_id = sub_categorytbl.sub_cat_id LEFT JOIN vtpartner.other_servicestbl ON enquirytbl.service_id = other_servicestbl.service_id LEFT JOIN vtpartner.vehiclestbl ON enquirytbl.vehicle_id = vehiclestbl.vehicle_id LEFT JOIN vtpartner.available_citys_tbl ON enquirytbl.city_id = available_citys_tbl.city_id WHERE enquirytbl.category_id = $1 order by enquiry_id desc";
    const values = [category_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      all_enquiries_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

//Other Services [ WireMan,etc ]
router.post("/all_gallery_images", verifyToken, async (req, res) => {
  try {
    const { category_type_id } = req.body;

    // List of required fields
    const requiredFields = {
      category_type_id,
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
      "select gallery_id,image_url,category_type,epoch from vtpartner.service_gallerytbl,vtpartner.category_type_tbl where service_gallerytbl.category_type_id=category_type_tbl.cat_type_id and service_gallerytbl.category_type_id=$1";
    const values = [category_type_id];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      gallery_images_data: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

router.post("/add_gallery_image", verifyToken, async (req, res) => {
  try {
    const { image_url, category_type_id } = req.body;

    // List of required fields
    const requiredFields = {
      image_url,
      category_type_id,
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

    // If pincode is not duplicate, proceed to insert
    const query =
      "INSERT INTO vtpartner.service_gallerytbl (image_url,category_type_id) VALUES ($1, $2)";
    const values = [image_url, category_type_id];
    const rowCount = await db.insertQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing add new gallery image query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing add new gallery image query" });
  }
});

router.post("/edit_gallery_image", verifyToken, async (req, res) => {
  try {
    const { image_url, gallery_id } = req.body;

    // List of required fields
    const requiredFields = {
      image_url,
      gallery_id,
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

    // If pincode is not duplicate, proceed to insert
    const query =
      "UPDATE vtpartner.service_gallerytbl set image_url=$1,epoch=EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) where gallery_id=$2";
    const values = [image_url, gallery_id];
    const rowCount = await db.updateQuery(query, values);

    // Send success response
    res.status(200).send({ message: `${rowCount} row(s) inserted` });
  } catch (err) {
    console.error("Error executing updating gallery image query", err.stack);
    res
      .status(500)
      .send({ message: "Error executing updating gallery image query" });
  }
});

//All Enquiries
router.post("/enquiries_all", verifyToken, async (req, res) => {
  try {
    const query =
      "SELECT enquiry_id,enquirytbl.category_id, enquirytbl.sub_cat_id, enquirytbl.service_id,enquirytbl.vehicle_id, enquirytbl.city_id, name, mobile_no, enquirytbl.time_at, source_type,enquirytbl.status, category_name, sub_cat_name, service_name, city_name, vehicle_name,enquirytbl.status,category_type FROM vtpartner.enquirytbl LEFT JOIN vtpartner.categorytbl ON enquirytbl.category_id = categorytbl.category_id LEFT JOIN vtpartner.sub_categorytbl ON enquirytbl.sub_cat_id = sub_categorytbl.sub_cat_id LEFT JOIN vtpartner.other_servicestbl ON enquirytbl.service_id = other_servicestbl.service_id LEFT JOIN vtpartner.vehiclestbl ON enquirytbl.vehicle_id = vehiclestbl.vehicle_id LEFT JOIN vtpartner.available_citys_tbl ON enquirytbl.city_id = available_citys_tbl.city_id LEFT JOIN vtpartner.category_type_tbl ON categorytbl.category_type_id = category_type_tbl.cat_type_id  order by enquiry_id desc";
    const values = [];

    const result = await db.selectQuery(query, values);

    if (result.length === 0) {
      return res.status(404).send({ message: "No Data Found" });
    }

    res.status(200).send({
      all_enquiries_details: result,
    });
  } catch (err) {
    console.error("Error executing query", err.stack);
    if (err.message === "No Data Found")
      res.status(404).send({ message: "No Data Found" });
    else res.status(500).send({ message: "Internal Server Error" });
  }
});

// router.post("/register_driver_agent", verifyToken, async (req, res) => {
//   try {
//     // Destructure fields from request body
//     const {
//       agent_name,
//       mobile_no,
//       gender,
//       aadhar_no,
//       pan_no,
//       city_name,
//       house_no,
//       address,
//       agent_photo_url,
//       aadhar_card_front_url,
//       aadhar_card_back_url,
//       pan_card_front_url,
//       pan_card_back_url,
//       license_front_url,
//       license_back_url,
//       insurance_image_url,
//       noc_image_url,
//       pollution_certificate_image_url,
//       rc_image_url,
//       vehicle_image_url,
//       category_id,
//       vehicle_id,
//       city_id,
//       optionalDocuments,
//       owner_name,
//       owner_mobile_no,
//       owner_house_no,
//       owner_city_name,
//       owner_address,
//       owner_photo_url,
//     } = req.body;

//     // Required fields check
//     const requiredFields = {
//       agent_name,
//       mobile_no,
//       gender,
//       aadhar_no,
//       pan_no,
//       category_id,
//       vehicle_id,
//       city_id,
//     };

//     const missingFields = Object.keys(requiredFields).filter(
//       (field) => !requiredFields[field]
//     );

//     if (missingFields.length > 0) {
//       return res.status(400).json({
//         message: `Missing required fields: ${missingFields.join(", ")}`,
//       });
//     }

//     // Check if owner exists by mobile number
//     let ownerId = null;
//     if (owner_name && owner_mobile_no) {
//       const checkOwnerQuery = `
//         SELECT owner_id 
//         FROM vtpartner.owner_tbl 
//         WHERE owner_mobile_no = $1
//       `;
//       const ownerResult = await db.query(checkOwnerQuery, [owner_mobile_no]);

//       if (ownerResult.rows.length > 0) {
//         // Owner exists, get the existing owner ID
//         ownerId = ownerResult.rows[0].owner_id;
//       } else {
//         // Insert owner data into owner_tbl if it does not exist
//         const insertOwnerQuery = `
//           INSERT INTO vtpartner.owner_tbl (
//             owner_name, owner_mobile_no, house_no, city_name, address, profile_photo
//           ) VALUES ($1, $2, $3, $4, $5, $6)
//           RETURNING owner_id
//         `;

//         const ownerValues = [
//           owner_name,
//           owner_mobile_no,
//           owner_house_no,
//           owner_city_name,
//           owner_address,
//           owner_photo_url,
//         ];

//         const newOwnerResult = await db.insertQuery(
//           insertOwnerQuery,
//           ownerValues
//         );
//         ownerId = newOwnerResult.rows[0].owner_id;
//       }
//     }

//     // Insert agent data into goods_driverstbl, including image URLs
//     const insertGoodsDriverQuery = `
//       INSERT INTO vtpartner.goods_driverstbl (
//         driver_first_name, mobile_no, gender, aadhar_no, pan_card_no, 
//         city_name, house_no, full_address, profile_pic, aadhar_card_front, 
//         aadhar_card_back, pan_card_front, pan_card_back, license_front, 
//         license_back, insurance_image, noc_image, pollution_certificate_image, 
//         rc_image, vehicle_image, category_id, vehicle_id, city_id, owner_id
//       ) 
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
//       $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
//       RETURNING goods_driver_id
//     `;

//     const agentValues = [
//       agent_name,
//       mobile_no,
//       gender,
//       aadhar_no,
//       pan_no,
//       city_name,
//       house_no,
//       address,
//       agent_photo_url,
//       aadhar_card_front_url,
//       aadhar_card_back_url,
//       pan_card_front_url,
//       pan_card_back_url,
//       license_front_url,
//       license_back_url,
//       insurance_image_url,
//       noc_image_url,
//       pollution_certificate_image_url,
//       rc_image_url,
//       vehicle_image_url,
//       category_id,
//       vehicle_id,
//       city_id,
//       ownerId,
//     ];

//     const agentResult = await db.insertQuery(
//       insertGoodsDriverQuery,
//       agentValues
//     );
//     const goodsDriverId = agentResult.rows[0].goods_driver_id;

//     // Insert optional documents into documents_vehicle_verified_tbl if any
//     if (optionalDocuments && optionalDocuments.length > 0) {
//       const insertDocumentQuery = `
//         INSERT INTO vtpartner.documents_vehicle_verified_tbl (
//           document_name, document_image_url, goods_driver_id
//         ) 
//         VALUES ($1, $2, $3)
//       `;

//       for (const doc of optionalDocuments) {
//         const documentValues = [doc.other, doc.imageUrl, goodsDriverId];
//         await db.insertQuery(insertDocumentQuery, documentValues);
//       }
//     }

//     // Respond with success
//     res.status(200).json({
//       message: `Agent and owner registered successfully with Agent ID: ${goodsDriverId}`,
//     });
//   } catch (error) {
//     console.error("Error registering new goods agent:", error);
//     res.status(500).json({
//       message: "An error occurred while registering the agent.",
//     });
//   }
// });

//

//Registering All Agents After Enquiry is Done
router.post("/register_agent", verifyToken, async (req, res) => {
  try {
    // Destructure fields from request body
    console.log("req.body::", req.body);
    const {
      enquiry_id,
      agent_name,
      mobile_no,
      gender,
      aadhar_no,
      pan_no,
      city_name,
      house_no,
      address,
      agent_photo_url,
      aadhar_card_front_url,
      aadhar_card_back_url,
      pan_card_front_url,
      pan_card_back_url,
      license_front_url,
      license_back_url,
      insurance_image_url,
      noc_image_url,
      pollution_certificate_image_url,
      rc_image_url,
      vehicle_image_url,
      category_id,
      sub_cat_id,
      service_id,
      vehicle_id,
      city_id,
      optionalDocuments,
      owner_name,
      owner_mobile_no,
      owner_house_no,
      owner_city_name,
      owner_address,
      owner_photo_url,
    } = req.body;

    // Required fields check
    const requiredFields = {
      enquiry_id,
      agent_name,
      mobile_no,
      gender,
      aadhar_no,
      pan_no,
      category_id,
      city_id,
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

    // Check if owner exists by mobile number
    let ownerId = null;
    if (owner_name && owner_mobile_no) {
      const checkOwnerQuery = `
        SELECT owner_id 
        FROM vtpartner.owner_tbl 
        WHERE owner_mobile_no = $1
      `;
      const ownerResult = await db.query(checkOwnerQuery, [owner_mobile_no]);

      if (ownerResult.rows.length > 0) {
        // Owner exists, get the existing owner ID
        ownerId = ownerResult.rows[0].owner_id;
      } else {
        // Insert owner data into owner_tbl if it does not exist
        const insertOwnerQuery = `
          INSERT INTO vtpartner.owner_tbl (
            owner_name, owner_mobile_no, house_no, city_name, address, profile_photo
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING owner_id
        `;

        const ownerValues = [
          owner_name,
          owner_mobile_no,
          owner_house_no,
          owner_city_name,
          owner_address,
          owner_photo_url,
        ];

        const newOwnerResult = await db.insertQuery(
          insertOwnerQuery,
          ownerValues
        );
        ownerId = newOwnerResult.rows[0].owner_id;
      }
    }

    // Insert agent data based on category_id
    let driverTable, nameColumn, driverIdField, driverId;
    console.log("category_id type:", typeof category_id, "value:", category_id);

    switch (category_id) {
      case 1: // Goods Driver
        driverTable = "vtpartner.goods_driverstbl";
        nameColumn = "driver_first_name";
        driverIdField = "goods_driver_id";
        break;
      case 2: // Cab Driver
        driverTable = "vtpartner.cab_driverstbl";
        nameColumn = "driver_first_name";
        driverIdField = "cab_driver_id";
        break;
      case 3: // JCB/Crane Driver
        driverTable = "vtpartner.jcb_crane_driverstbl";
        nameColumn = "driver_name";
        driverIdField = "jcb_crane_driver_id";
        break;
      // case 4: // Driver
      //   driverTable = "vtpartner.jcb_crane_driverstbl";
      //   nameColumn = "driver_name";
      //   driverIdField = "jcb_crane_driver_id";
      //   break;
      case 5: // Handyman Service
        driverTable = "vtpartner.handyman_servicestbl";
        nameColumn = "name";
        driverIdField = "handyman_id";
        break;
      default:
        return res.status(400).json({ message: "Invalid category_id" });
    }
    console.log("driverTable::", driverTable);

    // Prepare common values
    const commonValues = [
      agent_name,
      mobile_no,
      gender,
      aadhar_no,
      pan_no,
      city_name,
      house_no,
      address,
      agent_photo_url,
      aadhar_card_front_url,
      aadhar_card_back_url,
      pan_card_front_url,
      pan_card_back_url,
      ownerId,
    ];

    // Insert into appropriate driver table
    let insertDriverQuery;
    let driverValues;
console.log("commonValues:", commonValues);
    if (category_id === 5) {
      // Handyman Service specific columns
      insertDriverQuery = `
        INSERT INTO ${driverTable} (
          ${nameColumn}, mobile_no, gender, aadhar_no, pan_card_no, 
          city_name, house_no, full_address, profile_pic, 
          aadhar_card_front, aadhar_card_back, pan_card_front, 
          pan_card_back, category_id, city_id, sub_cat_id, service_id,owner_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 
          $10, $11, $12, $13, $14, $15, $16)
        RETURNING ${driverIdField}
      `;
      driverValues = [
        ...commonValues,
        category_id,
        city_id,
        sub_cat_id,
        service_id,
      ];
    } else {
      // Other categories (Goods, Cab, JCB/Crane)
      insertDriverQuery = `
        INSERT INTO ${driverTable} (
          ${nameColumn}, mobile_no, gender, aadhar_no, pan_card_no, 
          city_name, house_no, full_address, profile_pic, 
          aadhar_card_front, aadhar_card_back, pan_card_front, 
          pan_card_back, license_front, license_back, 
          insurance_image, noc_image, pollution_certificate_image, 
          rc_image, vehicle_image, category_id, vehicle_id, city_id, owner_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 
          $10, $11, $12, $13, $14, $15, $16, $17, $18, 
          $19, $20, $21, $22, $23, $24, $25)
        RETURNING ${driverIdField}
      `;
      driverValues = [
        ...commonValues,
        agent_photo_url,
        aadhar_card_front_url,
        aadhar_card_back_url,
        pan_card_front_url,
        pan_card_back_url,
        license_front_url,
        license_back_url,
        insurance_image_url,
        noc_image_url,
        pollution_certificate_image_url,
        rc_image_url,
        vehicle_image_url,
        category_id,
        vehicle_id,
        city_id,
      ];
    }

    const driverResult = await db.insertQuery(insertDriverQuery, driverValues);
    driverId = driverResult.rows[0][driverIdField];

    // Insert optional documents into documents_vehicle_verified_tbl if any
    if (optionalDocuments && optionalDocuments.length > 0) {
      const insertDocumentQuery = `
        INSERT INTO vtpartner.documents_vehicle_verified_tbl (
          document_name, document_image_url, ${driverIdField}
        ) 
        VALUES ($1, $2, $3)
      `;

      for (const doc of optionalDocuments) {
        const documentValues = [doc.other, doc.imageUrl, driverId];
        await db.insertQuery(insertDocumentQuery, documentValues);
      }
    }

    // Respond with success
    res.status(200).json({
      message: `Agent and owner registered successfully with Agent ID: ${driverId}`,
    });
  } catch (error) {
    console.error("Error registering new agent:", error);
    res.status(500).json({
      message: "An error occurred while registering the agent.",
    });
  }
});

router.get("/check_driver_existence", verifyToken, async (req, res) => {
  try {
    const { mobile_no } = req.query;

    // Validate that mobile_no is provided
    if (!mobile_no) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    // Query to check if the driver exists with the given mobile number
    const checkDriverQuery = `
      SELECT goods_driver_id 
      FROM vtpartner.goods_driverstbl 
      WHERE mobile_no = $1
    `;

    const result = await db.query(checkDriverQuery, [mobile_no]);

    if (result.rows.length > 0) {
      // Driver exists, return a message with their ID
      const driverId = result.rows[0].goods_driver_id;
      return res.status(200).json({
        message: `Driver already exists with ID: ${driverId}`,
        exists: true,
        driverId: driverId,
      });
    } else {
      // Driver does not exist
      return res.status(200).json({
        message:
          "Driver does not exist. Mobile number is available for registration.",
        exists: false,
      });
    }
  } catch (error) {
    console.error("Error checking driver existence:", error);
    res.status(500).json({
      message: "An error occurred while checking driver existence.",
    });
  }
});






module.exports = router;
