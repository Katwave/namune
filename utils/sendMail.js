const nodemailer = require("nodemailer");

const mailTransport = (options = { host: "mail.smtp2go.com", port: 80 }) => {
  // Using nodemailer to send emails
  return nodemailer.createTransport({
    host: options.host,
    port: options.port, // 8025, 587 and 25 can also be used (or 2525).
    auth: {
      user: process.env.USER,
      pass: process.env.PASS,
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
    // logger: true,
  });
};

const sendMail = (
  transportOptions,
  from,
  to,
  subject,
  html,
  handlers = { err: null, success: null },
  attachments = [
    {
      filename: "emailBanner.png",
      path: process.cwd() + "/public/img/emailBanner.png",
      cid: "emailBanner@domiher.com", //same cid value as in the html img src
    },
  ]
) => {
  // Transporting the email
  const transport = mailTransport(transportOptions && transportOptions);

  return transport.sendMail(
    {
      from: from,
      to: to,
      subject: subject,
      attachments,
      html: html,
    },
    (err, info) => {
      if (err) {
        console.log("Failed to send mail (Could be your internet connection)");
        handlers.err(err);
      } else {
        console.log("Send mail success: " + info + "");
        handlers.success(info);
      }
    }
  );
};

module.exports = sendMail;
