const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const model = require("../models/studentModel")

module.exports = {
  //nodemailer sending application confirmation,otp,status of application
  sendMail: async (email, subject, text, html) => {
    try {
      var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: `${process.env.EMAIL_USER}`,
          pass: `${process.env.EMAIL_PASSWORD}`,
        },
      });

      var mailOptions = {
        from: `${process.env.EMAIL_USER}`,
        to: email,
        subject: subject,
        text: text,
        html: html,
      };
      let send = await transporter.sendMail(mailOptions);
      return send;
    } catch (error) {
      return error;
    }
  },

  otpGenerator: () => {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
    return { otp, expirationTime };
  },

  auth: async (req, res, next) => {
    try {
      const token = req.headers["authorization"];

      if (!token) {
        return res
          .status(403)
          .send({ responseCode: 403, responseMessage: "Access denied!!!" });
      } else {
        const result = await model.find(
          { _id: token._id },
          { status: "active" }
        );

        if (result) {
          jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
            if (err) {
              return res
                .status(400)
                .send({ responseCode: 400, responseMessage: "Bad request" });
            } else {
              req.userId = result._id;
              return next();
            }
          });
        } else {
          return res
            .status(403)
            .send({ responseCode: 403, responseMessage: "Unauthorized" });
        }
      }
    } catch (error) {
      return res
        .status(500)
        .send({ responseCode: 500, responseMessage: "Something went wrong" });
    }
  },

  getToken: async (payload) => {
    var token =  jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
  },
};
 