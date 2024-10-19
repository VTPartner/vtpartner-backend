// dashboard_api_v1.js
const express = require("express");
const jwt = require("jsonwebtoken"); // for generating tokens
const db = require("./db"); // Import the database functions


const router = express.Router();


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
    const query =
      "select vehicle_id,vehicle_name,weight,vehicle_types_tbl.vehicle_type_id,vehicle_types_tbl.vehicle_type_name,description,image,size_image from vtpartner.vehiclestbl,vtpartner.vehicle_types_tbl where vehiclestbl.vehicle_type_id=vehicle_types_tbl.vehicle_type_id order by vehicle_id desc";
    const values = [];

    const result = await db.selectQuery(query);

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
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
    } = req.body;

    // List of required fields
    const requiredFields = {
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
      "INSERT INTO vtpartner.vehiclestbl (vehicle_name,weight,vehicle_type_id,description,image,size_image) VALUES ($1, $2, $3,$4,$5,$6)";
    const values = [
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
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
      "UPDATE  vtpartner.vehiclestbl SET vehicle_name =$1,weight=$2,vehicle_type_id=$3,description=$4,image=$5,size_image =$6 where vehicle_id=$7";
    const values = [
      vehicle_name,
      weight,
      vehicle_type_id,
      description,
      image,
      size_image,
      vehicle_id,
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
      "select price_id,vehicle_city_wise_price_tbl.city_id,vehicle_city_wise_price_tbl.vehicle_id,starting_price_per_km,minimum_time,vehicle_city_wise_price_tbl.price_type_id,city_name,price_type,bg_image,time_created_at from vtpartner.available_citys_tbl,vtpartner.vehicle_city_wise_price_tbl,vtpartner.vehiclestbl,vtpartner.vehicle_price_type_tbl where vehicle_price_type_tbl.price_type_id=vehicle_city_wise_price_tbl.price_type_id and vehicle_city_wise_price_tbl.city_id=available_citys_tbl.city_id and vehicle_city_wise_price_tbl.vehicle_id=vehiclestbl.vehicle_id and vehicle_city_wise_price_tbl.vehicle_id=$1 order by price_id,city_name";
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



  


module.exports = router;
