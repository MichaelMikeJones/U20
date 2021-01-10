const express = require("express");

const {
    googleOauth,
    googleOauthCallback,
    githubOauth,
    githubOauthCallback
} = require("../controller/oAuth");

const {
    signup,
    login,
    forgotPassword,
    ResetPassword,
    logOut
} = require("../controller/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password", ResetPassword);
router.post("/logout", logOut);

// oAuth2
router.get("/google/callback", googleOauthCallback);
router.get("/google", googleOauth);
router.get("/github/callback", githubOauthCallback);
router.get("/github", githubOauth);

module.exports = router;
