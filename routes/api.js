const express = require("express");
const router = express.Router();

// Requiring the dotenv module
require("dotenv").config();

// All available routes
require("./load.routes")(router);

module.exports = router;
