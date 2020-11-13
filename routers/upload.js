const express = require("express");

const { protect } = require("../controller/auth");
const {
    uploader,
    uploadFileByUrl,
    uploadRes,
} = require("../controller/uploader");

const router = express.Router();

// Only users can upload
router.use(protect);

router.post("/", uploader.single("file"), uploadRes);
router.post("/url", uploadFileByUrl, uploadRes);

module.exports = router;