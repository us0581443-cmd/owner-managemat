const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create reusable transporter
function getTransporter() {
  const gmailUser = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
  const gmailPass = rawPass.replace(/\s+/g, '').trim();

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
  }

  // If custom SMTP host is provided
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
}

/**
 * Send OTP Verification Email to user's Gmail
 * @param {string} toEmail - Recipient Gmail address
 * @param {string} recipientName - Owner's full name
 * @param {string} otpCode - 6-digit OTP code
 */
async function sendOtpEmail(toEmail, recipientName, otpCode) {
  const transporter = getTransporter();
  const senderEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@nest-proptech.com';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 24px; text-align: center; }
        .logo-box { width: 50px; height: 50px; background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 12px; }
        .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: #94a3b8; font-size: 13px; margin: 4px 0 0 0; }
        .content { padding: 32px 28px; color: #334155; }
        .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
        .instruction { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .otp-box { background: #eff6ff; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace; margin: 0; }
        .otp-expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 500; }
        .notice { font-size: 12.5px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px; }
        .footer { background-color: #f8fafc; padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-box">N</div>
          <h1>NEST Property Management</h1>
          <p>Executive Property Owner Portal</p>
        </div>
        <div class="content">
          <div class="greeting">Assalam-o-Alaikum ${recipientName || 'Property Owner'},</div>
          <div class="instruction">
            Thank you for registering on <strong>NEST Property Management</strong>. Use the 6-digit verification code below to activate your account and access your dedicated property workspace.
          </div>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-expiry">⏱ Valid for 15 minutes</div>
          </div>
          <div class="notice">
            If you did not request this registration, please ignore this email. Do not share this OTP with anyone for security purposes.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} NEST PropTech Solutions. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n===============================================================`);
    console.log(`⚠️  GMAIL SMTP NOT CONFIGURED IN backend/.env`);
    console.log(`   Email intended for: ${toEmail}`);
    console.log(`   Recipient Name: ${recipientName}`);
    console.log(`   6-DIGIT OTP CODE: [ ${otpCode} ]`);
    console.log(`   To send actual emails to Gmail inboxes, please set:`);
    console.log(`   GMAIL_USER=your_gmail@gmail.com`);
    console.log(`   GMAIL_APP_PASSWORD=your_16_digit_app_password`);
    console.log(`===============================================================\n`);
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
      message: 'SMTP credentials missing in .env. OTP logged to console.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"NEST Property Management" <${senderEmail}>`,
      to: toEmail,
      subject: `${otpCode} is your NEST verification code`,
      text: `Your NEST verification code is: ${otpCode}. It will expire in 15 minutes.`,
      html: htmlContent
    });

    console.log(`\n===============================================================`);
    console.log(`✉️  EMAIL SENT SUCCESSFULLY TO GMAIL INBOX!`);
    console.log(`   To: ${toEmail}`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`===============================================================\n`);

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ FAILED TO SEND EMAIL TO ${toEmail}:`, error.message);
    return {
      sent: false,
      reason: 'SEND_FAILED',
      error: error.message
    };
  }
}

module.exports = {
  sendOtpEmail,
  getTransporter
};
