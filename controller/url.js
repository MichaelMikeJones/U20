const bower = require('bowser');
const VisitModel = require("../models/Visit");
const UrlModel = require("../models/URL");
const CatchAsync = require("../utilities/CatchAsync");
const AppError = require("../utilities/AppError");
const APIFeatures = require("../utilities/APIFeatures");

const getVisitorInfo = (req) => {
    const info = {
        userAgent: req.header('user-agent'), // User Agent we get from headers
        referrer: req.get('referrer'), //  Likewise for Referer
        ip: req.header('x-forwarded-for') || req.connection.remoteAddress || req.ip, // Get IP - allow for proxy
    };

    // ::ffff: is a subnet prefix for IPv4 (32 bit) addresses that are placed inside an IPv6 (128 bit) space.
    // more info: https://stackoverflow.com/a/33790357/11672221
    info.ip = info.ip.replace("::ffff:", "");

    // adding more info
    const res = bower.parse(info.userAgent);
    info.os = res.os.name;
    info.browser = res.browser.name;
    info.browserVersion = res.browser.version;
    info.device = res.platform.type;

    return info;
};

exports.getVisitorInfo = getVisitorInfo;

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
    const url = await UrlModel.findOne({ target: req.params.target }).cache(120, {
        visits: 1
    });

    if (!url) {
        return next(new AppError("URL not found!", 404));
    }

    if (url.expiresIn && url.expiresIn < new Date().getDate()) {
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

    // adding visits of api does not make sense
    // // add one to visits
    // url.visits += 1;
    // url.save();

    // // add visitor
    // const visitorInfo = getVisitorInfo(req);
    // // add the url
    // visitorInfo.url = url._id;
    // const visitRecord = await VisitModel.create(visitorInfo);

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
    const updatedUrl = await UrlModel.findOneAndUpdate({ target: req.params.target },
        req.body, {
            runValidators: true,
            new: true,
        }
    ).delCache();

    if (!updatedUrl) {
        return next(new AppError("URL not found!", 404));
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
    await UrlModel.findOneAndDelete({ target: req.params.target }).delCache();

    res.status(204).json({
        status: "success",
        message: 'URL deleted successfully',
        data: {
            url,
        },
    });
});

exports.getVisitStats = CatchAsync(async(req, res, next) => {
    const url = await UrlModel.findOne({ target: req.params.target });
    if (!url) return next(new AppError("This URL does not exists", 404));

    const funCountOccurs = `function(arr) {
        var counts = {};
        for (var i = 0; i < arr.length; i++) {
        var num = arr[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        return counts}`;

    const result = await VisitModel.aggregate([{
            $match: { url: url._id }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$visitedAt" },
                    month: { $month: "$visitedAt" },
                },
                total: { $sum: 1 },
                devices: { $push: "$device" },
                browser: { $push: "$browser" },
                //browserVersion: { $push: "$browserVersion" },
                os: { $push: "$os" },
            }
        },
        {
            $addFields: {
                Devices: {
                    $function: {
                        body: funCountOccurs,
                        args: ["$devices"],
                        lang: "js"
                    }
                },
                Os: {
                    $function: {
                        body: funCountOccurs,
                        args: ["$os"],
                        lang: "js"
                    }
                },
                Browsers: {
                    $function: {
                        body: funCountOccurs,
                        args: ["$browser"],
                        lang: "js"
                    }
                },
                Date: "$_id"
            }

        },
        {
            $project: {
                _id: 0,
                browser: 0,
                os: 0,
                devices: 0,
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        createdAt: url.createdAt,
        data: result
    });
});