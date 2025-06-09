class Auth {
  constructor(
    router,
    dependencies = {
      global: null,
      models: null,
      utils: null,
      hooks: null,
    }
  ) {
    this.router = router;
    this.dependencies = dependencies;
  }

  /**
   *
   * @description register a user
   * @param {*} req
   * @param {*} res
   */
  async register(req, res) {
    // Get the name attribute from from
    const body = req.body;

    // Database, bcrypt and user variables
    const User = this.dependencies.models.User;
    const onSuccessRegister = this.dependencies.hooks.onSuccessRegister;
    const onFailRegister = this.dependencies.hooks.onFailRegister;

    try {
      const { hash } = this.dependencies.utils.genHash({
        password: body.password,
      });
      const newUser = new User({ password: hash, ...body });

      // Saving the new buyer to the database
      const savedUser = await newUser.save();

      // Run the user's logic when registering
      onSuccessRegister &&
        onSuccessRegister({
          success: true,
          message: "You have now registered!",
          data: savedUser,
        });

      return res.status(200).json({
        success: true,
        message: "You have now registered!",
        data: savedUser,
      });
    } catch (err) {
      console.error("Error to save user:", err);

      if (err.errorResponse && err.errorResponse.code === 11000) {
        onFailRegister &&
          onFailRegister({
            message: "Account already exists!",
            success: false,
            data: null,
          });
        return res.status(500).json({
          message: "Account already exists!",
          success: false,
          data: null,
        });
      }

      onFailRegister &&
        onFailRegister({
          message: "Unable to save user!",
          success: false,
          data: null,
        });
      return res.status(500).json({
        message: "Unable to save user!",
        success: false,
        data: null,
      });
    }
  }

  /**
   *
   * @description verify a user's account
   * @param {*} req
   * @param {*} res
   */
  // Verify user
  async verifyUser(req, res) {
    // Get the token from the form
    const { token } = req.body;

    // User model
    const User = this.dependencies.models.User;

    // Hooks
    const onSuccessVerifyUser = this.dependencies.hooks.onSuccessVerifyUser;
    const onFailVerifyUser = this.dependencies.hooks.onFailVerifyUser;

    try {
      const user = await User.findOne({ token });

      if (!user) {
        const responce = {
          message: "You entered invalid token!",
          success: false,
          data: null,
        };

        onFailVerifyUser && onFailVerifyUser(responce);

        return res.status(400).json(responce);
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
            const responce = {
              message: "You have not registered!",
              success: false,
              data: null,
            };

            onFailVerifyUser && onFailVerifyUser(responce);

            return res.status(500).json(responce);
          }

          const responce = {
            message: "Your account is now verified!",
            success: true,
            data: user,
          };

          onSuccessVerifyUser && onSuccessVerifyUser(responce);

          return res.status(200).json(responce);
        } catch (err) {
          console.error(err);
          const responce = {
            message: "There was an error, try again later.",
            success: false,
            data: null,
          };

          onFailVerifyUser && onFailVerifyUser(responce);
          return res.status(500).json(responce);
        }
      }
    } catch (err) {
      const responce = {
        message: "Error occured on the server!",
        success: false,
        data: null,
      };

      onFailVerifyUser && onFailVerifyUser(responce);

      return res.status(500).json(responce);
    }
  }

  /**
   *
   * @description get login details
   * @param {*} req
   * @param {*} res
   */
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

  /**
   *
   * @description Login - Authenticate a user
   * @param {*} req
   * @param {*} res
   */
  // Logging in
  Login(req, res, next) {
    // Hooks
    const onSuccessLogin = this.dependencies.hooks.onSuccessLogin;
    const onFailLogin = this.dependencies.hooks.onFailLogin;

    this.dependencies.global.passport.authenticate(
      "local",
      (err, user, info) => {
        if (err) return next(err);

        if (!user) {
          const responce = {
            message: info.message,
            success: false,
            data: null,
          };
          onFailLogin && onFailLogin(responce);
          return res.status(401).json(responce);
        }

        req.logIn(user, (err) => {
          if (err) {
            console.log("Error: ", err);
            return next(err);
          } else {
            const responce = {
              message: "Successfully logged in!",
              success: true,
              data: user,
            };
            onSuccessLogin && onSuccessLogin(responce);
            return res.status(200).json(responce);
          }
        });
      }
    )(req, res, next);
  }

  /**
   *
   * @description Logout - Log the user out
   * @param {*} req
   * @param {*} res
   */
  // logout
  Logout(req, res) {
    // Hooks
    const onSuccessLogout = this.dependencies.hooks.onSuccessLogout;
    const onFailLogout = this.dependencies.hooks.onFailLogout;

    req.logout((err) => {
      if (err) {
        const responce = {
          message: "Error during logout",
          success: false,
          data: null,
        };
        onFailLogout && onFailLogout(responce);
        return res
          .status(500)
          .json({ message: "Error during logout", success: false, data: null });
      }

      const responce = {
        success: true,
        message: "You successfully logged out!",
        data: null,
      };
      onSuccessLogout && onSuccessLogout(responce);
      res.status(200).json(responce);
    });
  }

  /**
   *
   * @description Verify - Verify the user's email/username etc. to reset password
   * @param {*} req
   * @param {*} res
   */
  // Verifying user to reset password
  async verify(req, res) {
    // Hooks
    const onSuccessVerify = this.dependencies.hooks.onSuccessVerify;
    const onFailVerify = this.dependencies.hooks.onFailVerify;

    // Input value from the html form
    const body = req.body;

    // Bcrypt
    const bcrypt = this.dependencies.global.bcrypt;

    // Generate a random string to use as a token
    const token = this.dependencies.global.randomString.generate();

    // User model
    const User = this.dependencies.models.User;

    try {
      // 1. Find user
      const user = await User.findOne({ ...body }).exec();

      if (!user) {
        const responce = {
          message: `That ${Object.keys(body)[0]} is not registered!`,
          success: false,
          data: null,
        };
        onFailVerify && onFailVerify(responce);

        return res.status(404).json(responce);
      }

      // 2. Generate salt and hash token
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(token, salt);

      // 4. Update user with hashed token
      const updateResult = await User.updateOne(
        { _id: user._id },
        { $set: { token: hash } }
      ).exec();

      if (updateResult.matchedCount === 0) {
        const responce = {
          message: "Server failed to process your request!",
          success: false,
          data: null,
        };
        onFailVerify && onFailVerify(responce);

        return res.status(500).json(responce);
      }

      const responce = {
        message: "Email Successfully found!",
        success: true,
        data: user,
      };

      onSuccessVerify && onSuccessVerify(responce);
      return res.status(200).json(responce);
    } catch (err) {
      console.log("Error:", err);
      const responce = {
        success: false,
        message: "Error occurred on the server!",
        data: null,
        details:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      };
      onFailVerify && onFailVerify(responce);
      return res.status(500).json(responce);
    }
  }

  /**
   *
   * @description Change Password - Change the user's password
   * @param {*} req
   * @param {*} res
   */
  // Logic for changing/updating password
  async changePassword(req, res) {
    // Hooks
    const onSuccessChangePassword =
      this.dependencies.hooks.onSuccessChangePassword;
    const onFailChangePassword = this.dependencies.hooks.onFailChangePassword;

    const User = this.dependencies.models.User;

    const { password, userId } = req.body;

    // Using bcrypt to hash password
    const bcrypt = this.dependencies.global.bcrypt;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

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
          const responce = {
            message: "Failed to reset your password. Invalid Token",
            success: false,
            data: null,
          };
          onFailChangePassword && onFailChangePassword(responce);

          return res.status(400).json(responce);
        } else {
          const responce = {
            message: "You successfully reset your password!",
            success: true,
            data: user,
          };
          onSuccessChangePassword && onSuccessChangePassword(responce);
          return res.status(200).json(responce);
        }
      })
      .catch(() => {
        const responce = {
          message: "Unable to change your password!",
          success: false,
          data: null,
        };
        onFailChangePassword && onFailChangePassword(responce);

        return res.status(500).json(responce);
      });
  }

  /**
   *
   * @description Delete User - Delete the logged in user
   * @param {*} req
   * @param {*} res
   */
  async deleteAccount(req, res) {
    const User = this.dependencies.models.User;

    // Hooks
    const onSuccessDeleteUser = this.dependencies.hooks.onSuccessDeleteUser;
    const onFailDeleteUser = this.dependencies.hooks.onFailDeleteUser;

    try {
      // 1. Verify user exists and is authenticated
      const userId = req.user ? req.user._id : false; // From authenticated session

      if (!userId) {
        const responce = {
          success: false,
          message: "Not authenticated",
          data: null,
        };
        onFailDeleteUser && onFailDeleteUser(responce);
        return res.status(401).json(responce);
      }

      // 2. Delete the user account
      const deleteResult = await User.deleteOne({ _id: userId }).exec();

      if (deleteResult.deletedCount === 0) {
        const responce = {
          success: false,
          message: "User not found",
          data: null,
        };
        onFailDeleteUser && onFailDeleteUser(responce);
        return res.status(404).json(responce);
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
          const responce = {
            success: true,
            message: "Account successfully deleted",
            data: req.user,
          };
          onSuccessDeleteUser && onSuccessDeleteUser(responce);

          res.status(200).json(responce);
        });
      });
    } catch (error) {
      console.error("Account deletion error:", error);
      const responce = {
        success: false,
        message: "Account deletion failed",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
        data: null,
      };
      onFailDeleteUser && onFailDeleteUser(responce);
      return res.status(500).json(responce);
    }
  }

  /**
   *
   * @description Register all routes
   */
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
    this.router.post("/verify", this.verify);
    this.router.post("/reset-password", this.changePassword);

    // Delete Account
    this.router.post("/delete-account", this.deleteAccount);
  }
}

module.exports = Auth;
