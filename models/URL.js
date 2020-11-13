const mongoose = require("mongoose");
const validator = require("validator");
var crypto = require("crypto");
const { bool } = require("sharp");

const UrlSchema = new mongoose.Schema({
    orgUrl: {
        type: String,
        required: [true, "Provide original URL"],
        validate: {
            validator: validator.isURL,
            message: 'Please privide a valid Url'
        }
    },
    target: {
        type: String,
        required: [true, "target is required!"],
        unique: true,
        validate: {
            validator: function(target) {
                return target.match(/[a-z0-9]{6}/);
            },
            message: "Shorted id is not valid",
        },
    },
    visits: {
        type: Number,
        min: 0,
        default: 0
    },
    public: {
        type: Boolean,
        default: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// creating taget
UrlSchema.pre('validate', function(next) {
    if (this.target) return next();

    this.target = crypto.randomBytes(3).toString('hex');
    next();
});

// Excluding the __v field from results
UrlSchema.pre(/^find/, function(next) {
    this.select("-__v");
    next();
});

const URL = mongoose.model("URL", UrlSchema);
module.exports = URL;