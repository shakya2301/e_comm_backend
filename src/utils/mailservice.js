import nodemailer from 'nodemailer'
import asyncHandler from './asyncHandler.js';


export const sendMail = asyncHandler(async function (useremail, otp) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: `${process.env.EMAIL}`,
          pass: `${process.env.MAIL_PASS}`,
        },
      });
      const mailOptions = {
        from: `${process.env.EMAIL}`,
        to: `${useremail}`,
        subject: "Your verification OTP for the platform.",
        text: `The verification code for your account is ${otp}. PLEASE DO NOT SHARE IT WITH ANYONE.`,
      };
    
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          throw new apiError(500, "Error sending email");
        }
      });

      return true;
})
