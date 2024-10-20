// website_api_v1.js
const express = require("express");
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

module.exports = router;