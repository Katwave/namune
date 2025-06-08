class Auth {
  constructor(
    router,
    dependencies = {
      global: null,
      models: null,
      utils: null,
    }
  ) {
    this.router = router;
    this.dependencies = dependencies;
  }

  async register(req, res) {
    // Get the name attribute from from
    const { fullName, email, password } = req.body;

    // Database, bcrypt and user variables
    const bcrypt = this.dependencies.global.bcrypt;
    const User = this.dependencies.models.User;

    // Generate a random string to use as a token
    const token = this.dependencies.global.randomString.generate();

    try {
      const user = await User.findOne({ email: email });

      // Check if user already exists in the database
      if (user) {
        // If user already exists then redirect to the register page
        const error_msg = "E-mail already exists!";
        return res.status(400).json({ message: error_msg, success: false });
      } else {
        // Generating salt in bcryp
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: "Unable to generate salt for password!",
            });
          } else {
            bcrypt.hash(password, salt, (err, hash) => {
              if (err) {
                return res.status(500).json({
                  success: false,
                  message: "Unable to hash password!",
                });
              } else {
                const newUser = new User({
                  fullName,
                  email: email.toLowerCase(),
                  password: hash,
                  token: token,
                });

                // Saving the new buyer to the database
                newUser
                  .save()
                  .then((resp) => {
                    // Include Logic For Sending an Email Below
                    // CODE HERE...

                    return res.status(200).json({
                      success: true,
                      message: "You have now registered!",
                    });
                  })
                  .catch((err) => {
                    return res.status(500).json({
                      message: "Unable to save user!",
                      success: false,
                    });
                  });
              }
            });
          }
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err });
    }
  }

  // Verify user
  async verifyUser(req, res) {
    // Get the token from the form
    const { token } = req.body;

    // User model
    const User = this.dependencies.models.User;

    try {
      const user = await User.findOne({ token });

      if (!user) {
        return res
          .status(400)
          .json({ message: "You entered invalid token!", success: false });
      } else {
        try {
          const result = await User.updateOne(
            { _id: user._id },
            {
              $set: {
                accountActive: true,
                token: "",
              },
            }
          );

          if (result.matchedCount === 0) {
            return res.status(500).json({
              message: "You have not registered!",
              success: false,
            });
          }

          return res.status(200).json({
            message: "Your account is now verified!",
            success: true,
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({
            message: "There was an error, try again later.",
            success: false,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Error occured on the server!", success: false });
    }
  }

  // Get Login Data
  getUserLogin(req, res) {
    if (req.user) {
      const user = req.user;

      return res.status(200).json({
        success: true,
        message: "Successfully logged in!",
        data: user,
      });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Login Unsuccessfully!" });
    }
  }

  // Logging in
  Login(req, res, next) {
    this.dependencies.global.passport.authenticate(
      "local",
      (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({
            message: info.message,
            success: false,
          });
        }
        req.logIn(user, (err) => {
          if (err) {
            console.log("Error: ", err);
            return next(err);
          } else {
            return res.status(200).json({
              message: "Successfully logged in!",
              success: true,
              data: user,
            });
          }
        });
      }
    )(req, res, next);
  }

  // logout
  Logout(req, res) {
    req.logout((err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error during logout", success: false });
      }
      res.status(200).json({
        success: true,
        message: "You successfully logged out!",
      });
    });
  }

  // Verifying email to reset password
  async verifyEmail(req, res) {
    // Input value from the html form
    const { email } = req.body;

    // Bcrypt
    const bcrypt = this.dependencies.global.bcrypt;

    // Generate a random string to use as a token
    const token = this.dependencies.global.randomString.generate();

    // User model
    const User = this.dependencies.models.User;

    try {
      // 1. Find user by email
      const user = await User.findOne({ email: email.toLowerCase() }).exec();

      if (!user) {
        return res
          .status(404)
          .json({ message: "That email is not registered!", success: false });
      }

      // 2. Generate salt and hash token
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(token, salt);

      // Include Logic For Sending an Email Below
      // CODE HERE...

      // 4. Update user with hashed token
      const updateResult = await User.updateOne(
        { _id: user._id },
        { $set: { token: hash } }
      ).exec();

      if (updateResult.matchedCount === 0) {
        return res.status(500).json({
          message: "Server failed to process your request!",
          success: false,
        });
      }

      return res.status(200).json({
        message: "Email Successfully found!",
        success: true,
      });
    } catch (err) {
      console.log("Error:", err);
      return res.status(500).json({
        success: false,
        message: "Error occurred on the server!",
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  }

  // Logic for changing/updating password
  changePassword(req, res) {
    const User = this.dependencies.models.User;

    const { password, userId } = req.body;

    // Using bcrypt to hash password
    const bcrypt = this.dependencies.global.bcrypt;

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Server failure!", success: false });
      } else {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Server failure!", success: false });
          } else {
            User.findOneAndUpdate(
              { _id: userId },
              {
                $set: {
                  password: hash,
                  token: "",
                },
              },
              { new: true }
            )
              .then((user) => {
                if (!user) {
                  return res.status(400).json({
                    message: "Failed to reset your password. Invalid Token",
                    success: false,
                  });
                } else {
                  return res.status(200).json({
                    message: "You successfully reset your password!",
                    success: true,
                  });
                }
              })
              .catch(() => {
                return res.status(500).json({
                  message: "Unable to change your password!",
                  success: false,
                });
              });
          }
        });
      }
    });
  }

  async deleteAccount(req, res) {
    const User = this.dependencies.models.User;

    try {
      // 1. Verify user exists and is authenticated
      const userId = req.user ? req.user._id : false; // From authenticated session

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Not authenticated" });
      }

      // 2. Delete the user account
      const deleteResult = await User.deleteOne({ _id: userId }).exec();

      if (deleteResult.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // 3. Optional: Clean up related data (example)
      // await SomeRelatedModel.deleteMany({ userId }).exec();

      // 4. Logout the user after deletion
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        // Destroy session
        return req.session.destroy(() => {
          res.status(200).json({
            success: true,
            message: "Account successfully deleted",
          });
        });
      });
    } catch (error) {
      console.error("Account deletion error:", error);
      return res.status(500).json({
        success: false,
        message: "Account deletion failed",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      });
    }
  }

  registerRoutes() {
    // Registering
    this.router.post("/register", this.register);

    // Verifying account after registering
    this.router.post("/verify/account", this.verifyUser);

    // Login and logout
    this.router.get(
      "/login",
      this.dependencies.global.authenticate,
      this.getUserLogin
    );
    this.router.post("/login", this.Login);
    this.router.get("/logout", this.Logout);

    // Forgot password
    this.router.post("/verify-email", this.verifyEmail);
    this.router.post("/reset-password", this.changePassword);

    // Delete Account
    this.router.post("/delete-account", this.deleteAccount);
  }
}

module.exports = Auth;
