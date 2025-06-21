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
- 🖂 Mail Sending
- < > Advanced Pagination
- 💳 Payments with payfast
- 📁 Cloud File Uploads (To AWS S3)

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
# or
nmn create myproject
```

```bash
# For hot reload when you save changes
npm run dev
# or for manual reload
npm start
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
    // Add your seperate custom local strategies for login authentication to the list
    // Make sure to seperate strategyName with one dash (e.g user-local)
    strategyList: [
      {
        strategyName: "user-local",
        model: sharedDependencies.models.User, // Make sure this is included in shared.deps.js file
        usernameField: "email", // Change relevant logic in routes/auth/api.routes.js to match your username field
        verifyAccount: (user) => {
          if (!user.accountActive) return "Please verify your email first.";
          return null;
        },
      },
    ],
  },
};
```

### Authentication Middleware

#### `ensureAuthenticated(req, res, next)`

Middleware that checks if a user is authenticated. Returns 401 if not.

### Authentication Routes (Can't be overwritten)

- `POST /v1/auth/register` - User registration
- `POST /v1/auth/verify/account` - Account verification
- `POST /v1/auth/login` - User login
- `GET /v1/auth/logout` - User logout
- `POST /v1/auth/verify-email` - Email verification for password reset
- `POST /v1/auth/reset-password` - Password reset
- `POST /v1/auth/delete-account` - Account deletion

---

### Hooks

##### AUTH Hooks: Returns a response

Response Structure: {success: boolean, message: string, data: any}

##### `onSuccessRegister`

##### `onFailRegister`

##### `onSuccessVerifyUser`

##### `onFailVerifyUser`

##### `onSuccessLogin`

##### `onFailLogin`

##### `onSuccessLogout`

##### `onFailLogout`

##### `onSuccessDeleteUser`

##### `onFailDeleteUser`

##### `onSuccessVerify`

##### `onFailVerify`

##### `onSuccessChangePassword`

##### `onFailChangePassword`

Example

```javascript
// deps.js
module.exports = {
  global: {},
  models: {},
  utils: {},
  hooks: {
    onSuccessRegister: yourCustomFunction, // Fires when user successfully registers (/auth/register)
    onFailRegister: yourCustomFunction, // Fires when user fails to register (/auth/register)
  },
};
```

## Route Management

Routes are automatically loaded from the `routes` directory. Use this pattern:

```javascript
// routes/example/api.routes.js
class ExampleRoute {
  constructor(router, dependencies) {
    this.router = router;
    this.dependencies = dependencies;
  }

  exampleHandler(req, res) {
    res.json({ message: "Success" });
  }

  registerRoutes() {
    this.router.get("/", this.exampleHandler);
  }
}

module.exports = ExampleRoute;
```

---

## Configuration

### Environment Variables

##### GENERAL

| Variable        | Default                   | Description                              |
| --------------- | ------------------------- | ---------------------------------------- |
| `PORT`          | 8000                      | Server port                              |
| `MONGODB_URI`   | mongodb://localhost:27017 | MongoDB connection string                |
| `DATABASE_NAME` | example-db                | Database name                            |
| `NODE_ENV`      | development               | Runtime environment                      |
| `STAGING_ENV`   | undefined                 | Runtime environment                      |
| `STAGING_URL`   | undefined                 | URL for your staging client/frontend     |
| `PROD_URL`      | undefined                 | URL for your production client/frontend  |
| `DEV_URL`       | http://localhost:3000     | URL for your development client/frontend |

##### PAYMENTS (Using Payfast)

| Variable                             | Default                  | Description                           |
| ------------------------------------ | ------------------------ | ------------------------------------- |
| `NGROK_SERVER_URL`                   | http://localhost:8000/v1 | ngrok server url                      |
| `NGROK_CLIENT_URL`                   | http://localhost:3000    | ngrok client url                      |
| `PAYFAST_PASS_PHRASE`                | undefined                | Payfast Pass Phrase                   |
| `PAYFAST_MERCHANT_ID`                | 10000100                 | Payfast Merchant ID                   |
| `PAYFAST_MERCHANT_KEY`               | 46f0cd694581a            | Payfast Merchant Key                  |
| `PROD_API_URL`                       | undefined                | Production Api URL                    |
| `PAYFAST_PAYMENT_CONFIRM_EMAIL`      | undefined                | Email to send payment confirmation to |
| `process.env.PAYFAST_PAYMENT_METHOD` | cc                       | Payfast Payment method                |

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

### Generating Hash (for any string)

```javascript
// namune/utils/gen-hash.js
const genHash = require("namune/utils/gen-hash.js");
const hash = genHash({ password: "12345" });
```

### Send an email (Uses nodemailer)

```javascript
// namune/utils/sendMail.js
const sendMail = require("namune/utils/sendMail.js");

// Optional: Transport options. (Below is the dafault setup)
const transportOptions = {
  host: "mail.smtp2go.com",
  port: 80, // 25, 587, and 8025 can also be used (or 2525).
};

// IMPRTANT:
// Make sure you have USER and PASS in the .env file for authenticating your email for transport

// Options
const from = "fromexample@gmail.co";
const to = "toexample@gmail.co";
const subject = "Verify account";
const subject = "Verify account";
const attachments = [
  {
    filename: "emailBanner.png",
    path: process.cwd() + "/public/img/emailBanner.png",
    cid: "emailBanner@domiher.com",
  },
];
const html = "<h1> Hi, please verify your account </h1>";

const mailOptions = {
  from,
  to,
  subject,
  attachments,
  html,
};

sendMail(mailOptions);
```

### Lazy-Load Dependencies to avoid circular loop errors

```javascript
module.exports = {
  global: {},
  models: {},
  utils: {
    get myUtil() {
      return require("./utils/myUtil");
    },
  },
  hooks: {
    get onFailRegister() {
      return require("./hooks/register.fail");
    },
  },
};
```

### Pagination

##### Input

```javascript
// For non-routes
const paginate = require('namune/utils/paginate');

// For routes (api.routes.js)
// const paginate = this.dependencies.utils.paginate

const data = [
  { user: { name: "Alice" }, score: 91 },
  { user: { name: "Charlie" }, score: 82 },
  { user: { name: "Bob" }, score: 75 },
];

// Sort by nested property `user.name`
const result = paginate(data, {
  page: 1,
  limit: 2,
  sortBy: 'user.name',
  order: 'asc'
  filterFn: (item) => item.score > 50
});

console.log(result);
```

##### ✅ Output Sample

```bash
{
  data: [
    { user: { name: "Alice" }, score: 91 },
    { user: { name: "Bob" }, score: 75 }
  ],
  paginationMeta: {
    page: 1,
    limit: 2,
    totalItems: 3,
    totalPages: 2,
    hasNext: true,
    hasPrevious: false,
    nextPage: 2,
    previousPage: null
  }
}
```

###### Options

`page: Number` Page to go to - Optional (Default is 0)
`limit: Number` Number of items - Optional (Default is 10)
`sortBy: String` Sort the data. Allows for nested properties - Optional (Default is null)
`order` Order the Items by "asc" or "desc" - Optional (Default is "asc")
`filterFn` Filter Function to filter data - Optional (Default is null)

### Upload Files to cloud (Uses AWS S3)

```javascript
// Non routes
const { uploadBase64ImageToS3 } = require("namune/utils/cloudFileUpload");

// For routes (api.routes.js)
// const {uploadBase64ImageToS3} = this.dependencies.utils.cloudFileUpload

let base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA..."; // A base64 image
uploadBase64ImageToS3(base64).then(console.log);
```

##### Options (Second Parameter after base64)

`ACL: String` For Access Control - Optional (Default is "public-read")
`appendKey: String` Folder in bucket - Optional (Default is "image-upload")
`region: String` Your S3 bucket region - Optional (Default is "eu-north-1")

#### Other functions (supports multipart/form-data)

`uploadImage`
`uploadVideo`
`uploadAudio`

Example

```javascript
const multer = require("multer");
const upload = multer(); // memoryStorage by default

// ... Class logic for routes
registerRoutes(){
  this.router.post("/upload/image", upload.single("file"), async (req, res) => {
    const result = await this.dependencies.utils.cloudFileUpload.uploadImage(req.file);
    res.json(result);
  });

  this.router.post("/upload/video", upload.single("file"), async (req, res) => {
    const result = await this.dependencies.utils.cloudFileUpload.uploadVideo(req.file);
    res.json(result);
  });

  this.router.post("/upload/audio", upload.single("file"), async (req, res) => {
    const result = await this.dependencies.utils.cloudFileUpload.uploadAudio(req.file);
    res.json(result);
  });
}
```

##### Options for the above functions:

`buffer: Buffer` - File buffer
`originalName: String` - Original file name (e.g. image.jpg)
`folder: String` - Folder in bucket (e.g. images, audio, videos)
`options: {ACL: String, ContentType: String}` - Optional: ACL, ContentType

#### Delete uploaded files

`deleteFile` - Expects a file param
`deleteMultipleFiles` - Expects an array of AWS keys (e.g. ['images/image.jpg', 'images/image2.jpg'])
`deleteAllFilesInFolder` - Expects a prefix (e.g. "images/user123/")

##### Options

`file: {Key: String, VersionId: any, Location: String}` - File object uploaded. versionId is optional
`keys: String[]` - Array of Keys

Example

```js
// Delete specific files
await deleteMultipleFiles(["images/abc.jpg", "videos/test.mp4"]);

// Delete everything under a folder
await deleteAllFilesInFolder("images/user123/");
```

### Payments Using Payfast

Example

```js
// In Routes context

// Making the payment signature
this.router.get("/order", (req, res) => {
  const payfast = this.dependencies.utils.payfast;

  const { data, html } = payfast.sig({
    firstname: order.customerFirstName, // Required
    lastname: order.customerLastName, // Required
    email: order.customerEmail, // Required
    payment_id: `${order.orderNumber}`, // Required
    amount: `${order.totalPrice}`, // Required
    order_num: `#${order.orderNumber}`, // Required
    phone: order.customerPhoneNumber, // Optional
    address: order.customerAddress, // Optional
  });

  return res.status(200).json({
    success: true,
    message: "Successful!",
    data: { data, html },
  });

  /* Data returned from payfast.sig:
  merchant_id,
  merchant_key,
  return_url,
  cancel_url,
  notify_url,
  name_first,
  name_last,
  email_address,
  m_payment_id,
  amount,
  item_name,
  email_confirmation,
  confirmation_address,
  payment_method,
  signature
  */
});

// Request from Payfast after cancellation or successful payment
this.router.post("/notify", async (req, res) => {
  const { m_payment_id, amount_gross } = await req.body;
  const payfast = this.dependencies.utils.payfast;

  // Notify/Confirmation
  payfast.confirm(req, amount_gross);

  return res.status(200).json({
    success: true,
    message: "Successful!",
    data: null,
  });
});
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
    userModel: require("./models/User"),
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
