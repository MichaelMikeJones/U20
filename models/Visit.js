const mongoose = require("mongoose");
const validator = require("validator");

const VisitSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: [true, "Provide IP of the visitor"],
        validate: {
            validator: validator.isIP,
            message: "Please provide a valid IP"
        }
    },
    userAgent: {
        type: String,
        required: [true, "Provide user agent"]
    },
    referrer: String,
    device: String,
    browser: String,
    browserVersion: String,
    os: String,
    visitedAt: {
        type: Date,
        required: true,
        default: Date.now()
    },
    url: {
        type: mongoose.Schema.ObjectId,
        ref: "URL"
    }
});

VisitSchema.pre('save', function(next) {
    this.browser = this.browser ? this.browser : "unknown browser";
    this.browserVersion = this.browserVersion ? this.browserVersion : "unknown browser version";
    this.os = this.os ? this.os : "unknown os";
    this.device = this.device ? this.device : "unknown device type";
    next();
});

const Visit = mongoose.model("Visit", VisitSchema);
module.exports = Visit;