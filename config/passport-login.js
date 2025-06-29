const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

/**
 *
 * @description Initialize Passport Local Strategy
 * @param {*} passport Passport library
 * @param {*} User User model
 * @param {*} usernameField The username field to use for authentication
 */
const initialize = (passport, User, usernameField) => {
  passport.use(
    new LocalStrategy(
      { usernameField },
      (usernameFieldValue, password, done) => {
        //match user
        User.findOne({ [usernameField]: usernameFieldValue.toLowerCase() })
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message: `That ${usernameField} is not registered`,
              });
            } else {
              //match pass
              bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;

                if (isMatch) {
                  if (user.accountActive) {
                    return done(null, user);
                  } else {
                    return done(null, false, {
                      message: `Please verify your ${usernameField}!`,
                    });
                  }
                } else {
                  return done(null, false, { message: "Password incorrect!" });
                }
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    )
  );
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id).exec();
      if (!user) {
        return done(new Error("User not found"), null);
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

module.exports = initialize;
