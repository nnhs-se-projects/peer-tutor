const express = require("express");
const app = express();
const attendanceRoutes = require("./routes/attendance"); // Adjust path as needed
const path = require("path");

// ...existing code...

app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(attendanceRoutes);

// ...existing code...

module.exports = app;
