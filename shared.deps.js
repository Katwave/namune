const fs = require("fs");
const path = require("path");
const userModelPath = path.resolve(process.cwd(), "models", "User.js");

const sharedDependencies = {
  global: {
    authenticate: require("./config/auth"),
    randomString: require("randomstring"),
    bcrypt: require("bcryptjs"),
    passport: require("passport"),
  },
  models: { User: fs.existsSync(userModelPath) && require(userModelPath) },
  utils: {
    genHash: require("./utils/gen-hash.util"),
  },
  hooks: {}, // Empty this before publish to npm
};

module.exports = sharedDependencies;
