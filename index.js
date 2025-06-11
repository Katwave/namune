// Required modules
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const sharedDependencies = require("./shared.deps");
const MidsConfigs = require("./config/mids-configs");

// Change the configuration below to suit your needs
const mid_configs = new MidsConfigs(app);
mid_configs.registerMiddlewares({
  dbConfig: { database_name: process.env.DATABASE_NAME || "example-db" }, // Configure your database
  usePassportLogin: true, // Change to false if you don't need passport-local strategy
  passportConfig: {
    strategyList: [
      {
        strategyName: "user-local",
        model: sharedDependencies.models.User, // Make sure this is included in shared.deps.js file
        usernameField: "email", // Change relevant logic in routes/auth/api.routes.js to match your username field
        verifyAccount: (user) => {
          if (!user.accountActive) return "Please verify your email first.";
          return null;
        },
      },
    ],
  },
});

// Load Routes
app.use(`/v1/`, require("./routes/api"));

// This will fire if the requested route/url is not defined
app.get("/{*any}", (req, res) => {
  return res.json({ err: "That API route is not found!" });
});

const Port = process.env.PORT || 8000;
http.listen(Port, () => {
  console.log(`Server running on port ${Port}`);
});
