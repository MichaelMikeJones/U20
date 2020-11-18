const crypto = require('crypto');
const UrlModel = require("../models/URL");
const UserModel = require("../models/User");
const CatchAsync = require("../utilities/CatchAsync");
const AppError = require("../utilities/AppError");

exports.getUrl = CatchAsync(async(req, res, next) => {
    const url = await UrlModel.findOne({ target: req.params.target });

    if (!url) {
        return next(new AppError("Url not found!", 404));
    }

    if (url.password) {
        // password is associated with url
        return res.status(200).render("url-password", {
            title: "Redirecting",
            url
        });
    }

    // add one to visits
    url.visits += 1;
    url.save();

    res.status(200).redirect(url.orgUrl);
});

exports.getLanding = async(req, res, next) => {
    const publicUrls = await UrlModel.find({ public: true }).limit(10).sort('-createdAt');

    const noPublicUrls = await UrlModel.countDocuments({ public: true });
    const noPages = Math.ceil(noPublicUrls / 10);

    res.status(200).render('landing', {
        title: 'Main page',
        publicUrls,
        noPages
    });
}
exports.getDashboard = (req, res, next) => {
    res.status(200).render('dashboard', {
        title: 'Dashboard'
    });
}
exports.getCredintials = (req, res, next) => {
    res.status(200).render('credintials', {
        title: 'Credintials'
    });
}
exports.getUrls = async(req, res, next) => {
    const urls = await UrlModel.find({ user: req.user._id }).limit(10).sort('-createdAt');

    const noUrls = await UrlModel.countDocuments({ user: req.user._id });
    const noPages = Math.ceil(noUrls / 10);

    res.status(200).render('urls', {
        title: 'URLs',
        noPages,
        urls
    });
}
exports.getSettings = (req, res, next) => {
    res.status(200).render('settings', {
        title: 'Settings'
    });
}
exports.getLogin = (req, res, next) => {
    if (req.user) return res.status(200).redirect('/');

    res.status(200).render('login', {
        title: 'Login'
    });
}
exports.getSignup = (req, res, next) => {
    if (req.user) return res.status(200).redirect('/');

    res.status(200).render('signup', {
        title: 'Signup'
    });
}
exports.getForgotpassword = (req, res, next) => {
    res.status(200).render('forgot-password', {
        title: 'Forgot Password'
    });
}
exports.getResetPassword = async(req, res, next) => {
    const token = req.params.token;

    const decodedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await UserModel.findOne({
        passwordResetToken: decodedToken,
        passwordResetExpire: { $gt: Date.now() },
    });

    // check if the token is expired or there is a user
    if (!user) {
        return next(new AppError("Token has expired or is invalid!", 401));
    }

    res.status(200).render('reset-password', {
        title: 'Reset Password',
        token
    });
}