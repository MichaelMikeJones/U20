const {google} = require('googleapis');
const UserModel = require("../models/User");
const CatchAsync = require("../utilities/CatchAsync");
const AppError = require("../utilities/AppError");
const {setTokenCookie} = require('./auth');

const redirectSetToken = (res, user) => {
    setTokenCookie(res, user);
    res.status(302).redirect("/");
}

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    "http://127.0.0.1:5000/login/google/callback"
);

const handleUserLogin = async (data, tokens) => {
    let user;
    user = await UserModel.findOne({email: data.email});
    if(!user) {
        const userData = {
            fullname: data.name,
            email: data.email,
            google: {
                id: data.id,
                refreshToken: tokens.refresh_token,
                accessToken: tokens.access_token,
            },
            avatar: data.picture
        };

        user = await UserModel.create(userData);
    } else {
        user.google.id = data.id;
        user.google.refreshToken = tokens.refresh_token;
        user.google.accessToken = tokens.access_token;
        await user.save();
    }

    return user;
};

exports.googleOauthCallback = CatchAsync(async(req, res, next) => {
    const authCode = req.query.code;
    const {tokens} = await oauth2Client.getToken(authCode);

    const userinfo = await google.oauth2("v2").userinfo.get({
        oauth_token: tokens.access_token
    });

    const user = await handleUserLogin(userinfo.data, tokens);

    redirectSetToken(res, user);
});

exports.googleOauth = CatchAsync(async(req, res, next) => {
    const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "openid"
    ];

    const url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'offline',
      
        // If you only need one scope you can pass it as a string
        scope: scopes
    });

    res.status(200).redirect(url);
});

