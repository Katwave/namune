// Ensuring the user is authenticated before they can see important pages
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // If the user is not authenticated, redirect them to the login page
  return res.status(401).json({ error: "You are not logged in!" });
};

module.exports = ensureAuthenticated;
