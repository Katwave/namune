const express = require("express");
const path = require("path");
const router = express.Router();

// Requiring the dotenv module
require("dotenv").config();

// All available routes
loadRoutes(router, path.join(__dirname, "routes")); // User project routes
loadRoutes(router, path.join(require.resolve("namune"), "..", "routes")); // Namune internal routes

module.exports = router;
