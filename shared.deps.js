const sharedDependencies = {
  global: {
    authenticate: require("./config/auth"),
    randomString: require("randomstring"),
    bcrypt: require("bcryptjs"),
    passport: require("passport"),
  },
  models: { User: require("./models/User") },
  utils: {},
};

module.exports = sharedDependencies;
