const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

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

  // Serialization & Deserialization (you can override this if needed)
  passport.serializeUser((user, done) =>
    done(null, { id: user.id, strategy: strategyName })
  );

  passport.deserializeUser(async ({ id, strategy }, done) => {
    try {
      const user = await model.findById(id);
      if (!user) return done(new Error("User not found"));
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = createLocalStrategy;
