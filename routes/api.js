const express = require("express");
const path = require("path");
const router = express.Router();

// Requiring the dotenv module
require("dotenv").config();

// All available routes
require("./load.routes")(router);
require("./load.routes")(router, path.resolve(process.cwd(), "routes"));

module.exports = router;
