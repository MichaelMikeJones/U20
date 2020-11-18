const express = require("express");

const { protect, isLoggedIn } = require("../controller/auth");
const { getAllUrls, getUrl, updateUrl, createUrl, deleteUrl, getLatestPublicURLs, getPublicURLs, getAccountUrls } = require("../controller/url");

const router = express.Router();

router.use(isLoggedIn);

router.route("/:target").post(getUrl).delete(protect, deleteUrl);
router.route("/").post(createUrl).get(protect, getAccountUrls, getAllUrls);
router.route("/public-urls").get(getPublicURLs, getAllUrls);
router.route("/latest-public").get(getLatestPublicURLs, getAllUrls);

module.exports = router;