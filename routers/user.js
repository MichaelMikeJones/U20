const express = require("express");
const { updateInfo, avatarUploader, avatarHandler } = require("../controller/user");
const {
    signup,
    login,
    forgotPassword,
    ResetPassword,
    updatePassword,
    protect,
    deleteMe,
    logOut
} = require("../controller/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password", ResetPassword);
router.post("/logout", logOut);

router.use(protect);
router.patch("/update-password", updatePassword);
router.patch("/update-me", avatarUploader.single('avatar'), avatarHandler, updateInfo);
router.delete("/delete-me", deleteMe);

module.exports = router;