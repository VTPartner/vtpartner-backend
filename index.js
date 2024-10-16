const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const dashboardApiV1 = require("./dashboard_api_v1"); // Import the dashboard API routes
const multer = require("multer");
const path = require("path");
const sharp = require('sharp');


const app = express();

// Use CORS middleware to allow requests from multiple origins
const allowedOrigins = [
  "http://77.37.47.156:3786",
  "https://vtpartner.org",
  "http://localhost:3004",
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps, curl requests)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg =
//           "The CORS policy for this site does not allow access from the specified Origin.";
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     methods: ["GET", "POST", "OPTIONS"], // Allow specific HTTP methods
//     allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
//   })
// );

const corsOrigin ={
    origin:'http://localhost:3004', //or whatever port your frontend is using
    credentials:true,            
    optionSuccessStatus:200
}
app.use(cors(corsOrigin));

app.use(bodyParser.json()); // To parse JSON bodies

// Use the dashboard API routes under /api/v1/dashboard
app.use("/api/v1/dashboard", dashboardApiV1);

// Serve static files from the new uploads directory
app.use("/uploads", express.static("/root/var/www/vtpartner.org/uploads")); // Pointing to your public uploads directory

// Use memory storage to handle file uploads in memory before processing
const storage = multer.memoryStorage(); // Store files in memory for processing

// Init upload
const upload = multer({
  storage: storage,
  // Remove the file size limit here
}).single("cityImage");

app.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).send("Error uploading file.");
    }
    
    try {
      // Create a unique filename
      const filename = `cityImage-${Date.now()}.jpg`;
      const outputPath = path.join("/root/var/www/vtpartner.org/uploads", filename);
      
      // Compress the image and save it
      await sharp(req.file.buffer)
        .resize({ width: 800 }) // Resize to 800px width while maintaining aspect ratio
        .jpeg({ quality: 80, progressive: true }) // Compress to JPEG format with quality 80
        .toFile(outputPath);

      // Return the full image URL under your domain
      const imageUrl = `https://vtpartner.org/uploads/${filename}`;
      res.status(200).json({ imageUrl });
      
    } catch (compressErr) {
      console.error("Compression error:", compressErr);
      return res.status(500).send("Error compressing file.");
    }
  });
});

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
