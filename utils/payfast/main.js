const config = require("./config");
const sig = require("./signature");
const confirm = require("./confirm");

const payfast = {
  config: config,
  sig: sig,
  confirm: confirm,
};

module.exports = payfast;
