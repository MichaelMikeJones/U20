const express = require("express");
const { updateInfo, avatarUploader, avatarHandler } = require("../controller/user");
const {
    updatePassword,
    protect,
    deleteMe,
} = require("../controller/auth");

const router = express.Router();

router.use(protect);
router.patch("/update-password", updatePassword);
router.patch("/update-me", avatarUploader.single('avatar'), avatarHandler, updateInfo);
router.delete("/delete-me", deleteMe);

module.exports = router;