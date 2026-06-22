import { Resend } from "resend";

let resendClient = null;

const getClient = () => {
  if (resendClient) return resendClient;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in environment variables.");
  }

  resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

/**
 * Sends the admin invite link to the invited person's email via Resend's
 * HTTP API. This avoids SMTP entirely, which is blocked on Render's free
 * tier - Resend works over normal HTTPS instead.
 *
 * Uses Resend's default testing sender address until a custom domain
 * is verified on the Resend account.
 */
export const sendAdminInviteEmail = async (
  toEmail,
  invitedName,
  inviteLink,
) => {
  const resend = getClient();

  const { data, error } = await resend.emails.send({
    from: "CivicSense <onboarding@resend.dev>",
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
  });

  if (error) {
    throw new Error(error.message || "Resend API error");
  }

  return { success: true, messageId: data?.id };
};
