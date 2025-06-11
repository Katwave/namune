const crypto = require("crypto");
const config = require("./config");
const cors = require("../../config/cors");

// Testing sandbox or live
const pfHost = config.testingMode
  ? "sandbox.payfast.co.za"
  : "www.payfast.co.za";

const generateSignature = (data, passPhrase = null) => {
  // Create parameter string
  let pfOutput = "";
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      if (data[key] !== "") {
        pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(
          /%20/g,
          "+"
        )}&`;
      }
    }
  }

  // Remove last ampersand
  let getString = pfOutput.slice(0, -1);
  if (passPhrase !== null) {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(
      /%20/g,
      "+"
    )}`;
  }

  return crypto.createHash("md5").update(getString).digest("hex");
};

const mainData = (order_data) => {
  // Send the customer to PayFast for payment
  const myData = [];
  // Merchant details
  myData["merchant_id"] = config.testingMode
    ? "10000100"
    : process.env.PAYFAST_MERCHANT_ID;
  myData["merchant_key"] = config.testingMode
    ? "46f0cd694581a"
    : process.env.PAYFAST_MERCHANT_KEY;
  // URLS
  myData["return_url"] = `${
    config.testingMode ? config.ngrokClient : cors()
  }/payment/success`;
  myData["cancel_url"] = `${
    config.testingMode ? config.ngrokClient : cors()
  }/payment/cancel`;
  myData["notify_url"] = `${
    config.testingMode ? config.ngrokServer : process.env.PROD_API_URL
  }/notify`;
  // Buyer details
  myData["name_first"] = order_data.firstname;
  myData["name_last"] = order_data.lastname;
  myData["email_address"] = order_data.email;
  // Transaction details
  myData["m_payment_id"] = order_data.payment_id;
  myData["amount"] = order_data.amount;
  myData["item_name"] = order_data.order_num;
  // Transaction options (Sending confirmation email to merchant)
  myData["email_confirmation"] = "1";
  myData["confirmation_address"] = process.env.PAYFAST_PAYMENT_CONFIRM_EMAIL;
  // Payment methods
  /*
  ‘eft’ – EFT
  ‘cc’ – Credit card
  ‘dc’ – Debit card
  ’mp’ – Masterpass
  ‘mc’ – Mobicred
  ‘sc’ – SCode
  ‘ss’ – SnapScan
  ‘zp’ – Zapper
  ‘mt’ – MoreTyme
  */
  myData["payment_method"] = process.env.PAYFAST_PAYMENT_METHOD;

  // Generate signature
  myData["signature"] = generateSignature(myData, config.passPhrase);

  // global data
  const gdata = {};

  // HTML
  let htmlForm = `<form action="https://${pfHost}/eng/process" method="post">`;
  for (let key in myData) {
    if (myData.hasOwnProperty(key)) {
      value = myData[key];
      if (value !== "") {
        htmlForm += `<input name="${key}" type="hidden" value="${value.trim()}" />`;
        gdata[key] = value;
      }
    }
  }

  htmlForm +=
    '<button class="INPT INPT-submit BTN-widow" type="submit">Pay now</button></form>';
  gdata["pfHost"] = `https://${pfHost}/eng/process`;

  return { html: htmlForm, data: gdata };
};

module.exports = mainData;
