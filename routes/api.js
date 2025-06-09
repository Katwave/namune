const express = require("express");
const path = require("path");
const router = express.Router();

// Requiring the dotenv module
require("dotenv").config();

// All available routes
require("./load.routes")(router, [
  path.join(__dirname, "routes"), // User-defined routes
  path.join(require.resolve("namune"), "..", "routes"), // Library routes
]);

module.exports = router;
