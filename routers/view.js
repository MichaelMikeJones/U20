const express = require("express");

const { isLoggedIn, protect } = require("../controller/auth");

const { getDashboard, getForgotpassword, getSignup, getLogin, getSettings, getUrls, getCredintials, getUrl, getLanding, getResetPassword, manageUrl } = require("../controller/view");

const router = express.Router();

router.use(isLoggedIn);

router.get("/account/settings", protect, getSettings);
router.get("/account/urls/:target", protect, manageUrl);
router.get("/account/urls", protect, getUrls);
router.get("/account/credintials", protect, getCredintials);
router.get("/account", protect, getDashboard);
router.get("/forgot", getForgotpassword);
router.get("/signup", getSignup);
router.get("/reset/:token", getResetPassword);
router.get("/login", getLogin);
router.get("/:target", getUrl);
router.get("/", getLanding);

module.exports = router;