const cors = () => {
  if (process.env.STAGING_ENV) {
    return process.env.STAGING_URL;
  } else if (process.env.NODE_ENV) {
    return process.env.PROD_URL;
  } else {
    return process.env.DEV_URL || "http://localhost:3000";
  }
};

module.exports = cors;
