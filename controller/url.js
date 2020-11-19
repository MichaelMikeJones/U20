const UrlModel = require("../models/URL");
const CatchAsync = require("../utilities/CatchAsync");
const AppError = require("../utilities/AppError");
const APIFeatures = require("../utilities/APIFeatures");

exports.getAccountUrls = (req, res, next) => {
    req.query.sort = '-createdAt';
    req.query.user = req.user._id;
    req.query.fields = '-_id -updatedAt -createdAt';
    next();
}

exports.getLatestPublicURLs = (req, res, next) => {
    req.query.sort = '-createdAt';
    req.query.public = true;
    req.query.fields = '-_id -updatedAt -createdAt';
    req.query.limit = 10;
    req.query.page = 1;
    next();
}

exports.getPublicURLs = (req, res, next) => {
    req.query.sort = '-createdAt';
    req.query.public = true;
    req.query.fields = '-_id -updatedAt -createdAt';
    next();
}

exports.getAllUrls = CatchAsync(async(req, res, next) => {
    const query = new APIFeatures(UrlModel, req.query)
        .filter()
        .sort()
        .excludeFields()
        .paginate();
    const urls = await query.query;

    res.status(200).json({
        status: "success",
        results: urls.length,
        data: {
            urls,
        },
    });
});

exports.getUrl = CatchAsync(async(req, res, next) => {
    const url = await UrlModel.findOne({ target: req.params.target });

    if (!url) {
        return next(new AppError("URL not found!", 404));
    }

    if (url.expiresIn < Date.now()) {
        return next(new AppError("URL is expired", 410));
    }

    if (url.password) {
        // password is associated with url
        if (!req.body.password) {
            return next(new AppError("Password is associated with url. pass the password.", 401));
        } else if (req.body.password !== url.password) {
            return next(new AppError("Password not correct", 401))
        }
    }

    // add one to visits
    url.visits += 1;
    url.save();

    res.status(200).json({
        status: "success",
        data: {
            url,
        },
    });
});

exports.createUrl = CatchAsync(async(req, res, next) => {
    if (req.user) {
        req.body.user = req.user._id;
    }

    const url = await UrlModel.create(req.body);

    res.status(201).json({
        status: "success",
        message: 'URL created successfully',
        data: {
            url,
        },
    });
});

exports.updateUrl = CatchAsync(async(req, res, next) => {
    const updatedUrl = await PostModel.findOneAndUpdate({ target: req.params.target },
        req.body, {
            runValidators: true,
            new: true,
        }
    );

    if (!updatedUrl) {
        return next(new AppError("Post not found!", 404));
    }

    res.status(200).json({
        status: "success",
        message: 'URL updated successfully',
        data: {
            updatedUrl,
        },
    });
});

exports.deleteUrl = CatchAsync(async(req, res, next) => {
    const url = await UrlModel.findOne({ target: req.params.target });

    if (!url) {
        return next(new AppError("Url not found!", 404));
    }

    if (req.user.role !== 'admin' && req.user._id.toString() !== url.user.toString()) {
        return next(new AppError(`You don't have permission`, 403));
    }

    // Deleting the url doc
    await UrlModel.findOneAndDelete({ target: req.params.target });

    res.status(204).json({
        status: "success",
        message: 'URL deleted successfully',
        data: {
            url,
        },
    });
});