const mongoose = require("mongoose");
const express = require("express");
const express_session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const passport = require("passport");
const pl = require("./pl");

class MidsConfigs {
  constructor(app) {
    this.express_app = app;
  }

  // Express app
  exp_app() {
    if (express) {
      return this.express_app;
    } else {
      throw Error("Mids-Configs Error: Express library not found!");
    }
  }

  // Express static assets
  exp_static(folder) {
    if (express) {
      return this.exp_app().use(express.static(`/${folder}`));
    } else {
      throw Error("Mids-Configs Error: Express library not found!");
    }
  }

  // Express cors setup
  exp_cors(options = { cred: false, orig: "*" }) {
    if (express) {
      const app = this.exp_app();
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", options.orig);
        res.header("Access-Control-Allow-Credentials", options.cred);
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization, withCredentials, Content-Disposition"
        );
        res.header(
          "Access-Control-Request-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization, withCredentials, Content-Disposition"
        );
        next();
      });
    } else {
      throw Error("Mids-Configs Error: Express library not found!");
    }
  }

  // Express sessions
  exp_sess(mongoURI) {
    if (typeof mongoURI !== "string") {
      throw new Error("MongoDB connection string must be a string");
    }

    if (!mongoURI.startsWith("mongodb://")) {
      throw new Error("Invalid MongoDB connection scheme");
    }

    if (express && express_session) {
      const app = this.exp_app();
      app.use(
        express_session({
          secret: "secret",
          resave: false,
          saveUninitialized: false,
          store: MongoStore.create({
            mongoUrl: mongoURI,
          }),
        })
      );
    } else {
      throw Error(
        "Mids-Configs Error: Express or Express Session library not found!"
      );
    }
  }

  // Mongoose setup

  // Mongoose uri
  mongoose_uri(db_name) {
    return process.env.MONGODB_URI || `mongodb://localhost:27017/${db_name}`;
  }

  // Connecting to mongodb
  mongoose_connector(db_name) {
    if (mongoose) {
      // removed options inside {} for compatibility with mongoose v6
      return mongoose.connect(this.mongoose_uri(db_name), {});
    } else {
      throw Error("Mids-Configs Error: Mongoose library not found!");
    }
  }

  // Creating a db connection instance
  db_instance() {
    if (mongoose) {
      return mongoose.connection;
    } else {
      throw Error("Mids-Configs Error: Mongoose library not found!");
    }
  }

  // Loggin info when connection passes or fails
  db_behave() {
    if (mongoose) {
      this.db_instance().on(
        "error",
        console.log.bind(console, "Unable connect to the database...")
      );
      this.db_instance().once("open", () => {
        console.log("Connected to the database...");
      });
    } else {
      throw Error("Mids-Configs Error: Mongoose library not found!");
    }
  }

  // Middleware for body parser
  bd_ps_mid() {
    if (this.express_app && bodyParser) {
      const app = this.exp_app();
      app.use(bodyParser.json({ limit: "50mb" }));
      app.use(
        bodyParser.urlencoded({
          extended: true,
          limit: "50mb",
        })
      );
    } else {
      throw Error(
        "Mids-Configs Error: Express or Body parser library not found!"
      );
    }
  }

  // Setting up passport middlewares and configs

  // Passport requirer
  run_passport_config(path, userModel, usernameField) {
    if (passport) {
      if (path) {
        if (!userModel) {
          throw Error("Mids-Configs Error: User Model Not Found/Provided!");
        }
        return require(`./${path}`)(passport, userModel, usernameField);
      } else {
        throw Error("Passport Error: Path to passport config not provided!");
      }
    } else {
      throw Error("Mids-Configs Error: Passport library not found!");
    }
  }

  // Passport middlewares
  passport_mids() {
    if (express && passport) {
      const app = this.exp_app();

      app.use(passport.initialize());
      app.use(passport.session());
    } else {
      throw Error("Mids-Configs Error: Passport or Express library not found!");
    }
  }

  /**
   *
   * @param {Object} options  {dbConfig: {database_name: string}, passportConfig: {strategyList: []}, usePassportLogin: boolean}
   * @param {Object} options.dbConfig - Database configuration (e.g., {database_name: 'exampleDB'})
   * @param {Object} options.passportConfig - Passport Local Strategy configuration (e.g., { strategyList: [{strategyName, model, usernameField, verifyAccount}] } )
   * @param {Boolean} options.usePassportLogin - To use passport local strategy (e.g., true)
   * @param {String} options.passportConfig.strategyList[].strategyName - Unique name for the strategy (e.g., 'user-local', 'admin-local')
   * @param {Mongoose.Model} options.passportConfig.strategyList[].model - The Mongoose model (User, Admin, etc.)
   * @param {String} [options.passportConfig.strategyList[].usernameField='email'] - Field to use as the username
   * @param {Function} [options.passportConfig.strategyList[].verifyAccount] - Optional function to check extra conditions (e.g., isActive)
   */
  // Register All Middlewares
  registerMiddlewares(
    options = {
      dbConfig: {
        database_name: null,
      },
      passportConfig: {
        strategyList: [],
      },
      usePassportLogin: false,
    }
  ) {
    // Imports cors config
    const corsConfig = require("./cors");

    // Static assests
    this.exp_static("public");

    // Enabling CORS
    this.exp_cors({ cred: true, orig: corsConfig() });

    // Connecting to MongoDB
    this.mongoose_connector(options.dbConfig.database_name);
    this.db_behave();

    // Body parser middleware
    this.bd_ps_mid();

    // Passport and Flash (express sessions)
    // options.usePassportLogin &&
    //   this.run_passport_config(
    //     "passport-login",
    //     options.passportConfig.userModel,
    //     options.passportConfig.usernameField
    //   );

    options.usePassportLogin &&
      options.passportConfig.strategyList.forEach((strategy) => {
        pl(passport, {
          strategyName: strategy.strategyName || "user-local",
          model: strategy.model,
          usernameField: strategy.usernameField || "email",
          verifyAccount: strategy.verifyAccount,
        });
      });

    // Express session
    this.exp_sess(this.mongoose_uri(options.dbConfig.database_name));

    // Passport middlewares
    this.passport_mids();
  }
}

module.exports = MidsConfigs;
