const crypto = require("crypto");
const config = require("./config");

//    Conduct security checks
const axios = require("axios");
const dns = require("dns");

const secCheck = (req, cartTotal) => {
  const pfHost = config.testingMode
    ? "sandbox.payfast.co.za"
    : "www.payfast.co.za";

  const pfData = JSON.parse(JSON.stringify(req.body));

  let pfParamString = "";
  for (let key in pfData) {
    if (pfData.hasOwnProperty(key) && key !== "signature") {
      pfParamString += `${key}=${encodeURIComponent(pfData[key].trim()).replace(
        /%20/g,
        "+"
      )}&`;
    }
  }

  // Remove last ampersand
  pfParamString = pfParamString.slice(0, -1);

  // Verify the signature
  const pfValidSignature = (pfData, pfParamString, pfPassphrase = null) => {
    // Calculate security signature
    if (pfPassphrase !== null) {
      pfParamString += `&passphrase=${encodeURIComponent(
        pfPassphrase.trim()
      ).replace(/%20/g, "+")}`;
    }

    const signature = crypto
      .createHash("md5")
      .update(pfParamString)
      .digest("hex");
    return pfData["signature"] === signature;
  };

  //   Check that the notification has come from a valid PayFast domain
  async function ipLookup(domain) {
    return new Promise((resolve, reject) => {
      dns.lookup(domain, { all: true }, (err, address, family) => {
        if (err) {
          reject(err);
        } else {
          const addressIps = address.map(function (item) {
            return item.address;
          });
          resolve(addressIps);
        }
      });
    });
  }

  const pfValidIP = async (req) => {
    const validHosts = [
      "www.payfast.co.za",
      "sandbox.payfast.co.za",
      "w1w.payfast.co.za",
      "w2w.payfast.co.za",
    ];

    let validIps = [];
    const pfIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    try {
      for (let key in validHosts) {
        const ips = await ipLookup(validHosts[key]);
        validIps = [...validIps, ...ips];
      }
    } catch (err) {
      console.error(err);
    }

    const uniqueIps = [...new Set(validIps)];

    if (uniqueIps.includes(pfIp)) {
      return true;
    }
    return false;
  };

  //   Compare payment data
  const pfValidPaymentData = (cartTotal, pfData) => {
    return (
      Math.abs(parseFloat(cartTotal) - parseFloat(pfData["amount_gross"])) <=
      0.01
    );
  };

  // Perform a server request to confirm the details
  const pfValidServerConfirmation = async (pfHost, pfParamString) => {
    const result = await axios
      .post(`https://${pfHost}/eng/query/validate`, pfParamString)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        console.error(error);
      });
    return result === "VALID";
  };

  const check1 = pfValidSignature(pfData, pfParamString)
    ? console.log("Valid signature")
    : console.log("Invalid signature");
  const check2 = pfValidIP(req)
    ? console.log("Valid IP")
    : console.log("Invalid IP");
  const check3 = pfValidPaymentData(cartTotal, pfData)
    ? console.log("Valid payment data")
    : console.log("Invalid payment data");
  const check4 = pfValidServerConfirmation(pfHost, pfParamString)
    ? console.log("Valid server confirmation")
    : console.log("Invalid server confirmation");

  if (check1 && check2 && check3 && check4) {
    // All checks have passed, the payment is successful
    console.log("Status: All checks have passed, the payment is successful");
  } else {
    // Some checks have failed, check payment manually and log for investigation
    console.log("Status: Some checks have failed");
  }
};

module.exports = secCheck;
