const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const strategyModelMap = {};

/**
 * @param {Object} passport - The passport instance
 * @param {Object} options
 * @param {String} options.strategyName - Unique name for the strategy (e.g., 'user-local', 'admin-local')
 * @param {Mongoose.Model} options.model - The Mongoose model (User, Admin, etc.)
 * @param {String} [options.usernameField='email'] - Field to use as the username
 * @param {Function} [options.verifyAccount] - Optional function to check extra conditions (e.g., isActive)
 */
function createLocalStrategy(
  passport,
  { strategyName, model, usernameField = "email", verifyAccount }
) {
  // Register strategy
  strategyModelMap[strategyName] = model;

  passport.use(
    strategyName,
    new LocalStrategy({ usernameField }, async (username, password, done) => {
      try {
        const user = await model.findOne({
          [usernameField]: username.toLowerCase(),
        });

        if (!user) {
          return done(null, false, {
            message: `No ${
              strategyName.split("-")[0]
            } found with that ${usernameField}`,
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return done(null, false, { message: "Incorrect password!" });
        }

        if (verifyAccount) {
          const errorMsg = verifyAccount(user);
          if (errorMsg) {
            return done(null, false, { message: errorMsg });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
}

/**
 * Configures passport serializeUser and deserializeUser for multiple strategies
 * @param {*} passport - Passport instance
 * @param {Array} strategies - Array of strategy configurations [{ strategyName, model }]
 */
const sdUser = (passport, strategies = []) => {
  const strategyMap = new Map(strategies.map((s) => [s.model, s.strategyName]));
  const modelMap = new Map(strategies.map((s) => [s.strategyName, s.model]));

  passport.serializeUser((user, done) => {
    for (const [model, strategyName] of strategyMap.entries()) {
      if (user instanceof model) {
        return done(null, { id: user._id, strategy: strategyName });
      }
    }
    return done(new Error("No matching strategy found for user type"));
  });

  passport.deserializeUser(async (sessionData, done) => {
    if (!sessionData) return done(null, null); // Add this critical line

    try {
      const { id, strategy } = sessionData;
      const Model = modelMap.get(strategy);
      if (!Model) return done(new Error(`Invalid strategy: ${strategy}`));

      const user = await Model.findById(id).exec();
      return done(null, user || null); // Return null if user not found
    } catch (err) {
      return done(err);
    }
  });
};

module.exports = { createLocalStrategy, sdUser };
