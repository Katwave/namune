const config = {
  ngrokServer: process.env.NGROK_SERVER_URL || "http://localhost:8000/v1",
  ngrokClient: process.env.NGROK_CLIENT_URL || "http://localhost:3000",
  passPhrase: process.env.PAYFAST_PASS_PHRASE,
  testingMode: process.env.NODE_ENV ? false : true,
};

module.exports = config;
