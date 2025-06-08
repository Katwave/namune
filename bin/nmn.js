#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function createProjectStructure(targetDir = process.cwd()) {
  const folders = ["routes", "models"];
  const files = {
    ".gitignore": "node_modules\n",

    ".env": `
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=myapp    
    `,

    "index.js": `
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const MidsConfigs = require("namune/config/mids-configs");

const mid_configs = new MidsConfigs(app);
mid_configs.registerMiddlewares({
  dbConfig: { database_name: process.env.DATABASE_NAME || "myapp" },
  usePassportLogin: true,
  passportConfig: {
    userModel: require("namune/models/User"),
    usernameField: "email",
  },
});

app.use("/v1/", require("namune/routes/api"));

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`,
  };

  folders.forEach((folder) => {
    const fullPath = path.join(targetDir, folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath);
      console.log(`Created folder: ${folder}`);
    }
  });

  Object.entries(files).forEach(([filename, content]) => {
    const fullPath = path.join(targetDir, filename);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
      console.log(`Created file: ${filename}`);
    }
  });

  console.log("✅ Project initialized!");
}

const command = process.argv[2];

if (command === "create") {
  createProjectStructure();
} else {
  console.log("Unknown command. Usage: nmn create");
}
