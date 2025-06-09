const fs = require("fs");
const path = require("path");
const express = require("express");

function loadRoutes(router, baseDirs = [__dirname]) {
  // Try loading user-defined custom dependencies
  let customDependencies = {};
  const userDepsPath = path.resolve(process.cwd(), "custom.deps.js");

  if (fs.existsSync(userDepsPath)) {
    try {
      customDependencies = require(userDepsPath);
    } catch (err) {
      console.error("⚠️ Failed to load custom.deps.js:", err);
    }
  }

  // Load shared deps from the library
  const sharedDependencies = require("../shared.deps");

  // Merge internal and user-defined dependencies
  const deps = {
    ...sharedDependencies,
    ...customDependencies,
  };

  // Loop through all base directories
  baseDirs.forEach((baseDir) => {
    try {
      const items = fs.readdirSync(baseDir, { withFileTypes: true });

      items.forEach((item) => {
        try {
          const fullPath = path.join(baseDir, item.name);

          if (item.isDirectory()) {
            // Recurse into subdirectories
            loadRoutes(router, [fullPath]);
          } else if (item.name === "api.routes.js") {
            // Clear cache in development
            if (!process.env.NODE_ENV && !process.env.STAGING_ENV) {
              delete require.cache[require.resolve(fullPath)];
            }

            const RouteModule = require(fullPath);

            // Use a sub-router to apply a route prefix (based on folder name)
            const subRouter = express.Router();

            // Handle class or function exports
            if (typeof RouteModule === "function") {
              if (
                RouteModule.prototype &&
                RouteModule.prototype.registerRoutes
              ) {
                const instance = new RouteModule(subRouter, deps);

                // Bind all methods to preserve 'this'
                Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                  .filter(
                    (prop) =>
                      typeof instance[prop] === "function" &&
                      prop !== "constructor"
                  )
                  .forEach((method) => {
                    instance[method] = instance[method].bind(instance);
                  });

                // Register routes with a folder-based prefix
                const folderPrefix = path.basename(path.dirname(fullPath));
                router.use(`/${folderPrefix}`, subRouter);

                instance.registerRoutes();
              } else {
                // Function-based export
                RouteModule(router, deps);
              }
            } else {
              console.error(
                `Invalid route module at ${fullPath}: Must export a class or function`
              );
            }
          }
        } catch (err) {
          console.error(`Trace ${item.name}: \n`, err);
        }
      });
    } catch (err) {
      console.error("❌ Fatal route loading error:", err);
      throw err;
    }
  });
}

module.exports = loadRoutes;
