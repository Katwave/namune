const fs = require("fs");
const path = require("path");
const express = require("express");

const userDepsPath = path.resolve(process.cwd(), "custom.deps.js");

function loadRoutes(router, baseDir = __dirname) {
  if (!fs.existsSync(baseDir)) {
    console.warn(`⚠️ Skipping missing directory: ${baseDir}`);
    return; // Skip loading if directory doesn't exist
  }

  // Create a sub-router for prefixed routes
  const subRouter = express.Router();

  // Load built-in shared dependencies
  const sharedDependencies = require("../shared.deps");

  // Load user's custom dependencies if available
  let customDependencies = {};

  if (fs.existsSync(userDepsPath)) {
    try {
      customDependencies = require(userDepsPath);
    } catch (err) {
      console.error("⚠️ Failed to load custom.deps.js:", err);
    }
  }

  const deps = {
    ...sharedDependencies,
    ...customDependencies,
    global: {
      ...sharedDependencies.global,
      ...(customDependencies.global || {}),
    },
    models: {
      ...sharedDependencies.models,
      ...(customDependencies.models || {}),
    },
    utils: {
      ...sharedDependencies.utils,
      ...(customDependencies.utils || {}),
    },
  };

  try {
    const items = fs.readdirSync(baseDir, { withFileTypes: true });

    items.forEach((item) => {
      try {
        const fullPath = path.join(baseDir, item.name);

        // If it's a directory, search recursively
        if (item.isDirectory()) {
          loadRoutes(router, fullPath); // Recurse
        }

        // If it's the target file (api.routes.js)
        else if (item.name === "api.routes.js") {
          // 4. Clear cache in development
          if (!process.env.NODE_ENV && !process.env.STAGING_ENV) {
            delete require.cache[require.resolve(fullPath)];
          }

          const RouteModule = require(fullPath);

          // Initialize routes
          // Handle both class and function exports
          if (typeof RouteModule === "function") {
            if (RouteModule.prototype) {
              if (RouteModule.prototype.registerRoutes) {
                const instance = new RouteModule(subRouter, deps);

                // Apply prefix to all routes
                const folderPrefix = path.basename(path.dirname(fullPath));
                router.use(`/${folderPrefix}`, subRouter);

                // Auto-bind all methods (So that "this" is accessible inside the Class methods)
                Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
                  .filter(
                    (prop) =>
                      typeof instance[prop] === "function" &&
                      prop !== "constructor"
                  )
                  .forEach((method) => {
                    instance[method] = instance[method].bind(instance);
                  });

                instance.registerRoutes();
              } else {
                throw new Error(
                  'Missing required function/method "registerRoutes"'
                ); // Crash app if base dir is inaccessible
              }
            } else {
              // Regular function export
              RouteModule(router, deps);
            }
          } else {
            console.error(
              `Invalid route module at ${fullPath}: Must export a class or function`
            );
          }
        }
      } catch (err) {
        console.error(`Trace ${item.name}: \n `, err);
        // Continue loading other routes
      }
    });
  } catch (err) {
    console.error("Fatal route loading error:", err);
    throw err; // Crash app if base dir is inaccessible
  }
}

module.exports = loadRoutes;
