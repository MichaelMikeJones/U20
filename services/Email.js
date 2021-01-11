const nodemailer = require("nodemailer");
// const sendinBlue = require('nodemailer-sendinblue-transport');

class Email {
    static transporter = nodemailer.createTransport({
        //host: process.env.EMAIL_SERVER,
        //port: parseInt(process.env.EMAIL_PORT, 10),
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
        secure: process.env.NODE_ENV === "production",
    });

    constructor(email) {
        this.to = email;
        this.from = `${process.env.EMAIL_SENDER} <${process.env.EMAIL_ADDRESS}>`;
    }

    async sendMail(text, subject, template = undefined) {
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            text,
            html: template,
        };
        // sending mail
        // Returns the results and can be assigned to a variable
        await Email.transporter.sendMail(mailOptions);
    }

    async sendForgotToken(token, req) {
        // sending reset token
        await this.sendMail(
            `Your reset token: ${token}\nClick the link to reset your password: ${req.protocol}://${req.headers.host}/reset/${token}`, 
            "U20: Reset Token"
        );
    }

    async sendOneTimePass(oneTimePass, user) {
        const message = `Dear ${user.fullname.split(" ")[0]},\nAn attempt was made to login to your account, if you didn't make this attempt please ignore this message.\n Your one time passcode: ${oneTimePass}\n This passcode will expire in 10 minutes.`;

        await this.sendMail(message, `U20: One time passcode`);
    }
}

module.exports = Email;