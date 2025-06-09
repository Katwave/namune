#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const namunePkg = require(path.join(__dirname, "..", "package.json"));
const namuneVersion = namunePkg.version;

function createProjectStructure(projectName) {
  const targetDir = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.error(`❌ Folder "${projectName}" already exists.`);
    process.exit(1);
  }

  fs.mkdirSync(targetDir);
  console.log(`📁 Created project folder: ${projectName}`);

  const folders = ["routes", "models"];

  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "",
    main: "index.js",
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
      start: "node index.js",
      dev: "nodemon index.js",
    },
    keywords: [],
    author: "",
    license: "ISC",
    dependencies: {
      namune: `^${namuneVersion}`,
    },
  };

  const files = {
    ".gitignore": "node_modules\n",

    ".env": `MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=myapp
`,

    "custom.deps.js": `module.exports = {
  global: {},
  models: {},
  utils: {}
};
`,

    "index.js": `require("dotenv").config();
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
    "package.json": JSON.stringify(packageJson, null, 2),
  };

  // Create folders
  folders.forEach((folder) => {
    const fullPath = path.join(targetDir, folder);
    fs.mkdirSync(fullPath);
    console.log(`📂 Created folder: ${folder}`);
  });

  // Create files
  Object.entries(files).forEach(([filename, content]) => {
    const fullPath = path.join(targetDir, filename);
    fs.writeFileSync(fullPath, content);
    console.log(`📄 Created file: ${filename}`);
  });

  // Create routes/foo/api.routes.js
  const fooRouteDir = path.join(targetDir, "routes", "foo");
  fs.mkdirSync(fooRouteDir, { recursive: true });
  const fooRouteContent = `class FooRoute {
    constructor(router, dependencies) {
      this.router = router;
      this.dependencies = dependencies;
    }

    getFoo(req, res) {
      return res
        .status(200)
        .json({ success: true, message: "Successfully found foo!" });
    }

    //   Add your other methods

    registerRoutes() {
      this.router.get("/", this.getFoo.bind(this));
    }
  }

  module.exports = FooRoute;
  `;

  fs.writeFileSync(path.join(fooRouteDir, "api.routes.js"), fooRouteContent);
  console.log("📄 Created file: routes/health/api.routes.js");

  console.log("✅ Project structure initialized.\n");

  runNpmInstall(targetDir);
}

function runNpmInstall(targetDir) {
  console.log("📦 Installing dependencies...");
  exec("npm install", { cwd: targetDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error installing dependencies: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ npm stderr: ${stderr}`);
    }
    console.log(stdout);
    console.log("✅ Dependencies installed.");
  });
}

const command = process.argv[2];
const projectName = process.argv[3];

if (command === "create") {
  if (!projectName) {
    console.error(
      "❌ Please provide a project name.\nUsage: nmn create <projectname>"
    );
    process.exit(1);
  }
  createProjectStructure(projectName);
} else {
  console.log("Unknown command. Usage: nmn create <projectname>");
}
