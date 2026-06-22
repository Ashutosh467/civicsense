import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      "GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables.",
    );
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465, false for 587
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    connectionTimeout: 10000, // 10s - fail fast instead of hanging
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
};

/**
 * Sends the admin invite link to the invited person's email.
 * Fails loudly (throws) so the caller can decide how to handle it -
 * e.g. log it and still let the invite be created (fail-open), the
 * same philosophy used for officer invite SMS.
 */
export const sendAdminInviteEmail = async (
  toEmail,
  invitedName,
  inviteLink,
) => {
  const mailer = getTransporter();

  const mailOptions = {
    from: `"CivicSense" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "You've been invited to CivicSense as an Admin",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #0F172A;">You've been invited to CivicSense</h2>
        <p>Hi ${invitedName},</p>
        <p>You've been invited to join <strong>CivicSense</strong> as an administrator. Click the button below to set up your account:</p>
        <p style="margin: 24px 0;">
          <a href="${inviteLink}" style="background: #06b6d4; color: #0F172A; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Set Up My Account
          </a>
        </p>
        <p style="font-size: 13px; color: #555;">Or copy this link into your browser:<br/>${inviteLink}</p>
        <p style="font-size: 13px; color: #888;">This link expires in 72 hours and can only be used once. If you weren't expecting this invite, you can safely ignore this email.</p>
      </div>
    `,
  };

  const info = await mailer.sendMail(mailOptions);
  return { success: true, messageId: info.messageId };
};
