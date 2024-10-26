# VTPartner Backend

This is the backend service for the VTPartner application, built with Express.js. It handles API requests for both the dashboard and website, manages file uploads, and performs various database operations.

## Features

- **API Endpoints:**
  - `/api/v1/dashboard`: Routes for dashboard-related functionalities.
  - `/api/v1/website`: Routes for website-related functionalities.
- **File Upload Handling:**
  - Supports image uploads with `multer`, storing files in a backend directory and moving them to a public directory.
- **Database Operations:**
  - Provides endpoints for `SELECT`, `INSERT`, and `UPDATE` operations on a `demo_tbl` table.
- **Static File Serving:**
  - Serves uploaded files from the `/uploads` directory.

-**To Start**: npm start

-**Add the following variables**
DB_USER=myuser
DB_HOST=localhost
DB_NAME=vtpartnerdb
DB_PASSWORD=Vtpartner@786
DB_PORT=5432
NODE_ENV=development
PORT=3786

-** The server will be running on 3786

-**Database Operations**
GET /api/: Fetch records from the demo_tbl table.
POST /api/insert: Insert a new record into the demo_tbl table.
PUT /api/update: Update a record in the demo_tbl table.

