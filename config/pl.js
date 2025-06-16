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
  // Create a map of models for quick lookup
  const strategyMap = new Map();
  strategies.forEach(({ strategyName, model }) => {
    strategyMap.set(model, strategyName);
  });

  // Serialize user with strategy info
  passport.serializeUser((user, done) => {
    try {
      // Find which strategy this user belongs to
      let strategyName = null;
      for (const [model, name] of strategyMap.entries()) {
        if (user instanceof model) {
          strategyName = name;
          break;
        }
      }

      if (!strategyName) {
        throw new Error("No matching strategy found for user type");
      }

      done(null, {
        id: user._id,
        strategy: strategyName,
      });
    } catch (err) {
      done(err);
    }
  });

  // Create a reverse map for deserialization
  const modelMap = new Map();
  strategies.forEach(({ strategyName, model }) => {
    modelMap.set(strategyName, model);
  });

  // Deserialize using correct model based on strategy
  passport.deserializeUser(async ({ id, strategy }, done) => {
    try {
      const Model = modelMap.get(strategy);
      if (!Model) {
        return done(new Error(`No model found for strategy: ${strategy}`));
      }

      const user = await Model.findById(id);
      if (!user) {
        return done(new Error("User not found"));
      }

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};

module.exports = { createLocalStrategy, sdUser };
