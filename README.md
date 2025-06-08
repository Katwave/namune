# namune

[![npm version](https://img.shields.io/npm/v/namune)](https://www.npmjs.com/package/namune)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**A production-ready Express.js library with built-in authentication, middleware configuration, and route management.**

---

## Features

- 🔐 Built-in authentication system (register, login, logout, verification)
- ⚙️ Configurable middleware stack (CORS, sessions, body parsing)
- 🗃️ MongoDB integration with Mongoose
- 🛣️ Automatic route loading and management
- 🔒 Passport.js integration for local authentication
- 🚀 Production-ready error handling and security practices
- 🧩 Modular architecture for easy extension

---

## Installation

```bash
npm install -g namune
# or
yarn global add namune
```

---

## Quick Start

```bash
nmn create
```

```javascript
// index.js
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const MidsConfigs = require("namune/config/mids-configs");

const mid_configs = new MidsConfigs(app);
mid_configs.registerMiddlewares({
  dbConfig: { database_name: process.env.DATABASE_NAME || "myapp" },
  usePassportLogin: true,
  passportConfig: {
    userModel: require("namune/models/User"),
    usernameField: "email",
  },
});

app.use("/v1/", require("namune/routes/api"));

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Create a `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=myapp
```

---

## API Reference

### Middleware Configuration (`MidsConfigs`)

#### `new MidsConfigs(app)`

- `app` (Express): Express application instance

#### Methods

##### `registerMiddlewares(options)`

Registers all middleware.

```javascript
options = {
  dbConfig: { database_name: "myapp" },
  usePassportLogin: true,
  passportConfig: {
    userModel: UserModel,
    usernameField: "email",
  },
};
```

### Authentication Middleware

#### `ensureAuthenticated(req, res, next)`

Middleware that checks if a user is authenticated. Returns 401 if not.

### Authentication Routes

- `POST /v1/auth/register` - User registration
- `POST /v1/auth/verify/account` - Account verification
- `POST /v1/auth/login` - User login
- `GET /v1/auth/logout` - User logout
- `POST /v1/auth/verify-email` - Email verification for password reset
- `POST /v1/auth/reset-password` - Password reset
- `POST /v1/auth/delete-account` - Account deletion

---

## Route Management

Routes are automatically loaded from the `routes` directory. Use this pattern:

```javascript
// routes/example/api.routes.js
class ExampleRoute {
  constructor(router, dependencies) {
    this.router = router;
  }

  exampleHandler(req, res) {
    res.json({ message: "Success" });
  }

  registerRoutes() {
    this.router.get("/", this.exampleHandler.bind(this));
  }
}

module.exports = ExampleRoute;
```

---

## Configuration

### Environment Variables

| Variable        | Default                   | Description               |
| --------------- | ------------------------- | ------------------------- |
| `PORT`          | 8000                      | Server port               |
| `MONGODB_URI`   | mongodb://localhost:27017 | MongoDB connection string |
| `DATABASE_NAME` | example-db                | Database name             |
| `NODE_ENV`      | development               | Runtime environment       |

### Middleware Options

You can configure:

- Database name
- Passport.js integration
- Session storage
- CORS settings
- Body parser limits

---

## Error Handling

- Authentication failures return `401`
- Database errors return `500`
- Invalid requests return `400`
- Route not found returns `404`
- JSON responses include `success` and `message` fields
- Detailed errors in `development` environment

---

## Examples

### Custom Route Implementation

```javascript
// routes/custom/api.routes.js
const { Router } = require("express");

class CustomRoute {
  constructor(router, dependencies) {
    this.router = router;
    this.dependencies = dependencies;
  }

  getData(req, res) {
    res.json({ data: "Protected resource", user: req.user });
  }

  registerRoutes() {
    const { authenticate } = this.dependencies.global;
    this.router.get("/data", authenticate, this.getData);
  }
}

module.exports = CustomRoute;
```

### Minimal Working Example

```javascript
// server.js
require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const MidsConfigs = require("namune/config/mids-configs");

const mids = new MidsConfigs(app);
mids.registerMiddlewares({
  dbConfig: { database_name: "myapp" },
  usePassportLogin: true,
  passportConfig: {
    userModel: require("namune/models/User"),
    usernameField: "email",
  },
});

app.use("/api", require("namune/routes/api"));

const PORT = process.env.PORT || 8000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).
