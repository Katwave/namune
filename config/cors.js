const cors = (
  options = {
    PROD_URL: null,
    STAGING_URL: null,
    DEV_URL: null,
  }
) => {
  if (process.env.STAGING_ENV) {
    return options.STAGING_URL;
  } else if (process.env.NODE_ENV) {
    return options.PROD_URL;
  } else {
    return options.DEV_URL || "http://localhost:3000";
  }
};

module.exports = cors;
