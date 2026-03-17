"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSessionInvitation = exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_config_1 = require("../config/email.config");
const logger_config_1 = __importDefault(require("../config/logger.config"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    host: email_config_1.emailConfig.smtp.host,
    port: email_config_1.emailConfig.smtp.port,
    secure: email_config_1.emailConfig.smtp.secure,
    auth: email_config_1.emailConfig.smtp.auth,
});
const sendVerificationEmail = async (to, otp, userName) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email for Joining Dots</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #F5F5F5;
        }
        .container {
          background-color: #FFFFFF;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo img {
          max-width: 180px;
          height: auto;
        }
        h1 {
          color: #2C3E50;
          border-bottom: 2px solid #3498DB;
          padding-bottom: 10px;
        }
        .otp {
          font-size: 36px;
          font-weight: bold;
          color: #3498DB;
          text-align: center;
          margin: 30px 0;
          letter-spacing: 8px;
          background-color: #F8F9FA;
          padding: 15px;
          border-radius: 8px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7f8c8d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="cid:logo" alt="Joining Dots Logo">
        </div>
        <h2 style="text-align: center;">Welcome to Joining Dots</h2>
        <p style="font-size: 18px; color: #555;">Hello ${userName},</p>
        <p>Thank you for joining Joining Dots. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
        <div class="otp">${otp}</div>
        <p>This OTP will expire in ${email_config_1.emailConfig.otpExpiryMinutes} minutes. If you didn't request this verification, please disregard this email.</p>
        <p>We're excited to have you on board!</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Joining Dots. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
    const mailOptions = {
        from: email_config_1.emailConfig.from,
        to,
        subject: 'Verify Your Email for Joining Dots',
        html: htmlContent,
    };
    try {
        await transporter.sendMail(mailOptions);
        logger_config_1.default.info(`Verification email sent successfully to ${to}`);
    }
    catch (error) {
        logger_config_1.default.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (to, otp, userName) => {
    const mailOptions = {
        from: email_config_1.emailConfig.from,
        to,
        subject: 'Reset Your Password - Joining Dots',
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to reset your password:</p>
      <div class="otp" style="font-size: 24px; font-weight: bold; color: #4a90e2; margin: 20px 0; padding: 10px; text-align: center; background: #f5f5f5; border-radius: 5px;">${otp}</div>
      <p>This OTP will expire in ${email_config_1.emailConfig.otpExpiryMinutes} minutes. If you didn't request this password reset, please ignore this email and ensure your account is secure.</p>
      <p>Best regards,<br>The Joining Dots Team</p>
    </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = async (to, name, password) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Joining Dots</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #F5F5F5;
        }
        .container {
          background-color: #FFFFFF;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .credentials {
          background-color: #F8F9FA;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7f8c8d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="text-align: center;">Welcome to Joining Dots</h2>
        <p style="font-size: 18px; color: #555;">Hello ${name},</p>
        <p>Your account has been created by the administrator. Here are your login credentials:</p>
        <div class="credentials">
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>For security reasons, we recommend changing your password after your first login.</p>
        <p>You can now log in to your account and start using our platform.</p>
        <p>Best regards,<br>The Joining Dots Team</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Joining Dots. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
    const mailOptions = {
        from: email_config_1.emailConfig.from,
        to,
        subject: 'Welcome to Joining Dots - Your Account Details',
        html: htmlContent,
    };
    try {
        await transporter.sendMail(mailOptions);
        logger_config_1.default.info(`Welcome email sent successfully to ${to}`);
    }
    catch (error) {
        logger_config_1.default.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendSessionInvitation = async (to, sessionTitle, joiningCode, createdByName, expiryDate) => {
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Session Invitation | Joining Dots</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #F5F5F5;
        }
        .container {
          background-color: #FFFFFF;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .code {
          font-size: 36px;
          font-weight: bold;
          color: #3498DB;
          text-align: center;
          margin: 30px 0;
          letter-spacing: 8px;
          background-color: #F8F9FA;
          padding: 15px;
          border-radius: 8px;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #7f8c8d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 style="text-align: center;">Session Invitation</h2>
        <p>You have been invited to join a session: the link is below</p>
        <p>https://joining-dots-frontend.vercel.app</p>
        <p><strong>Session:</strong> ${sessionTitle}</p>
        <p><strong>Created by:</strong> ${createdByName}</p>
        <p>Use the following code to join the session:</p>
        <div class="code">${joiningCode}</div>
        <p><strong>Note:</strong> This code will expire on ${expiryDate.toLocaleString()}</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Joining Dots. All rights reserved.</p>
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;
    const mailOptions = {
        from: email_config_1.emailConfig.from,
        to,
        subject: `Session Invitation: ${sessionTitle}`,
        html: htmlContent,
    };
    try {
        await transporter.sendMail(mailOptions);
        logger_config_1.default.info(`Session invitation email sent successfully to ${to}`);
    }
    catch (error) {
        logger_config_1.default.error('Error sending session invitation email:', error);
        throw new Error('Failed to send session invitation email');
    }
};
exports.sendSessionInvitation = sendSessionInvitation;
//# sourceMappingURL=email.util.js.map