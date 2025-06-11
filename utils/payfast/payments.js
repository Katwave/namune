const express = require("express");
const router = express.Router();
const sigData = require("./signature");
const confirm = require("./confirm");

router.get("/checkout", (req, res) => {
  const { html } = sigData();
  return res.status(200).render("checkout", { htmlForm: html });
});

// Redirecting user
router.get("/success", (req, res) => {
  return res.status(200).render("success");
});
router.get("/cancel", (req, res) => {
  return res.status(200).render("cancel");
});
router.post("/notify", (req, res) => {
  const { data } = sigData();

  //   Notify/Confirmation
  confirm(req, data.amount);
  return res.status(200).render("notify", { data });
});

module.exports = router;
