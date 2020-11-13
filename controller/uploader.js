const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const mime = require("mime-types");
const AppError = require("../utilities/AppError");
const CatchAsync = require("../utilities/CatchAsync");

const allowedToUpload = ["image"];
const uploadDirectory = "./public/img";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        const fileName = path.basename(file.originalname, ext);
        ext = ext.substr(1);
        cb(
            null,
            `${fileName.replace(/\s/g, "-")}-${req.user._id}-${Date.now()}.${ext}`
        );
    },
});

const filter = (req, file, cb) => {
    if (allowedToUpload.includes(file.mimetype.split("/")[0])) {
        cb(null, true);
    } else {
        cb(new AppError("Only images are allowed!", 400));
    }
};

exports.uploader = multer({
    storage,
    fileFilter: filter,
    limits: { fileSize: process.env.MAX_FILE_SIZE_UPLOAD * 1024 * 1024 },
});

exports.uploadFileByUrl = CatchAsync(async(req, res, next) => {
    const url = req.body.url;

    // Testing if the file size is exceeded
    const head = await axios({
        url,
        method: "HEAD",
    });

    if (
        head.headers["content-length"] >
        process.env.MAX_FILE_SIZE_UPLOAD * 1024 * 1024
    ) {
        return next(
            new AppError(
                `The file size limitation exceeded! File should be smaller than ${process.env.MAX_FILE_SIZE_UPLOAD}MB!`,
                413
            )
        );
    }

    const contentType = head.headers["content-type"];
    if (!contentType) {
        return next(
            new AppError(
                "This url does not provide mimetype. Download is not possible.",
                400
            )
        );
    }

    if (!allowedToUpload.includes(contentType.split("/")[0])) {
        return next(new AppError("Only images are allowed!", 400));
    }

    const contentLength = head.headers["content-length"];
    const ext = mime.extension(contentType);
    const fileName = `${req.user._id}-${Date.now()}${ext ? "." + ext : ""}`;
    const filePath = path.resolve(uploadDirectory, fileName);

    // Download the file
    const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
    });

    // Writing the stream into a binary file
    response.data.pipe(fs.createWriteStream(filePath));

    response.data.on("end", () => {
        // creating req.file
        req.file = {};
        req.file.size = contentLength;
        req.file.mimetype = contentType;
        req.file.filename = fileName;
        req.file.path = `img/${fileName}`;
        next();
    });

    response.data.on("error", (err) => {
        next(new AppError("Error occured during download. Please try again!", 500));
    });
});

exports.uploadRes = (req, res, next) => {
    // temperary. find a way to catch file not being sent
    if (!req.file) {
        return next(new AppError("Please provide a file", 400));
    }

    const filePath = req.file.path.replace("public/", "");
    res.status(200).json({
        status: "success",
        fileName: req.file.filename,
        path: `${req.protocol}://${req.headers.host}/${filePath}`,
        mimetype: req.file.mimetype,
        size: req.file.size,
    });
};