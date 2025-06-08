const sharedDependencies = {
  global: {
    authenticate: require("./config/auth"),
  },
  models: { User: require("./models/User") },
  utils: {},
};

module.exports = sharedDependencies;
