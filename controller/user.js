const multer = require('multer');
const Path = require('path');
const sharp = require('sharp');
const mime = require("mime-types");
const UserModel = require("../models/User");
const CatchAsync = require("../utilities/CatchAsync");
const AppError = require("../utilities/AppError");


const storage = multer.memoryStorage();

const allowedToUpload = ["image"];
const filter = (req, file, cb) => {
    if (allowedToUpload.includes(file.mimetype.split("/")[0])) {
        cb(null, true);
    } else {
        cb(new AppError("Only images are allowed!", 400));
    }
};

exports.avatarUploader = multer({
    storage,
    fileFilter: filter,
    limits: { fileSize: process.env.MAX_FILE_SIZE_UPLOAD * 1024 * 1024 },
});

exports.avatarHandler = CatchAsync(async(req, res, next) => {
    // no image received
    if (!req.file) {
        delete req.body.avatar;
        return next();
    }
    // resizing image
    const ext = mime.extension(req.file.mimetype);
    const filename = `avatar-${req.user._id}-${Date.now()}${ext ? "." + ext : ""}`;
    const path = Path.resolve('public/img', filename);
    await sharp(req.file.buffer, { failOnError: false }).resize(300, 300).toFile(path);
    req.body.avatar = filename;
    next();
});

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    allowedFields.forEach((el) => {
        if (obj[el]) newObj[el] = obj[el];
    });
    return newObj;
};

exports.updateInfo = CatchAsync(async(req, res, next) => {
    // check if there is password field
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                "Please use /api/user/update-password to update your password.",
                400
            )
        );
    }

    // update profile
    const filteredObj = filterObj(req.body,
        "fullname", "email", "avatar", "website", "twoWayAuth", "visibleProfile");
    const updatedUser = await UserModel.findByIdAndUpdate(
        req.user._id,
        filteredObj, {
            new: true,
            runValidators: true,
        }
    );

    // send back response
    res.status(200).json({
        status: "success",
        message: 'Account updated successfully',
        data: {
            user: updatedUser,
        },
    });
});