// website_api_v1.js
const express = require("express");
const db = require("./db"); // Import the database functions
const axios = require("axios");
const router = express.Router();
const mapKey = "AIzaSyAAlmEtjJOpSaJ7YVkMKwdSuMTbTx39l_o";
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

router.post("/all_services", async (req, res) => {
  try {
    const query =
      "select category_id,category_name,category_type_id,category_image,category_type,epoch from vtpartner.categorytbl,vtpartner.category_type_tbl where category_type_tbl.cat_type_id=categorytbl.category_type_id order by category_id asc";
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

router.post("/all_allowed_cities", async (req, res) => {
  const { city_id } = req.body;

  try {
    const result = await db.selectQuery(
      "select city_id,city_name,pincode,bg_image,time,pincode_until,description,status from vtpartner.available_citys_tbl order by city_id"
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

router.get("/distance", async (req, res) => {
  const { origins, destinations } = req.query;
  const apiKey = mapKey;

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=place_id:${origins}&destinations=place_id:${destinations}&units=metric&key=${apiKey}`
    );
    // res.json(response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching distance data" });
  }
});

module.exports = router;