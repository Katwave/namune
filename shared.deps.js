const fs = require("fs");
const path = require("path");
const userModelPath = path.resolve(process.cwd(), "models", "User.js");

const sharedDependencies = {
  global: {
    get authenticate() {
      return require("./config/auth");
    },
    get randomString() {
      return require("randomstring");
    },
    get bcrypt() {
      return require("bcryptjs");
    },
    get passport() {
      return require("passport");
    },
  },
  models: {
    get User() {
      return fs.existsSync(userModelPath) && require(userModelPath);
    },
  },
  utils: {
    get genHash() {
      return require("./utils/gen-hash");
    },
    get sendMail() {
      return require("./utils/sendMail");
    },
    get paginate() {
      return require("./utils/paginate");
    },
    get cloudFileUpload() {
      return require("./utils/cloudFileUpload");
    },
  },
  hooks: {}, // Empty this before publish to npm
};

module.exports = sharedDependencies;
