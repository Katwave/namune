// Required modules
const express = require("express");
const app = express();
const http = require("http").createServer(app);

// Middlewares and configs

const database_name = process.env.DATABASE_NAME || "example-db";
const sharedDependencies = require("./shared.deps");

const MidsConfigs = require("./config/mids-configs");
const mid_configs = new MidsConfigs(app);
console.log("database_name:", database_name);

// Change the configuration below to suit your needs
mid_configs.registerMiddlewares({
  dbConfig: { database_name }, // Configure your database
  usePassportLogin: true, // Change to false if you don't need passport-local strategy
  passportConfig: {
    userModel: sharedDependencies.models.User, // Make sure this is included in shared.deps.js file
    usernameField: "email", // Change to your relevant field if needed (e.g. username)
  },
});

// Importing pre-defined routes
const api = require("./routes/api");

// use pre-defined routers
app.use(`/v1/`, api);

// Resource not found 404

// "/{*any}" wildcard for express v5
// This will fire if the requested route/url is not defined
app.get("/{*any}", (req, res) => {
  res.json({ err: "That API route is not found!" });
});

// Setting up the port
const Port = process.env.PORT || 8000; // change to 5000 when using react.js/deploying

// Listening to the server
http.listen(Port, () => {
  console.log(`Listening on PORT ${Port}...`);
});
