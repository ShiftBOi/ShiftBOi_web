import nodemailer from "nodemailer";

type SendOtpArgs = {
  to: string;
  otp: string;
  type: string;
};

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function otpEmailHtml(otp: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:32px;">
          <tr><td style="font-size:20px;font-weight:600;padding-bottom:12px;">ShiftBOi CMS</td></tr>
          <tr><td style="color:#a3a3a3;font-size:14px;padding-bottom:20px;">Your one-time sign-in code:</td></tr>
          <tr><td style="font-size:32px;letter-spacing:0.35em;font-weight:700;padding-bottom:20px;">${otp}</td></tr>
          <tr><td style="color:#757575;font-size:13px;">Expires in 10 minutes. If you did not request this, ignore this email.</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends OTP by email when SMTP is configured.
 * In development without SMTP, logs the code to the server console.
 */
export async function sendOtpEmail({ to, otp, type }: SendOtpArgs): Promise<void> {
  const subject = `Your ShiftBOi CMS code: ${otp}`;
  const text = [
    `Your one-time code is ${otp}.`,
    `Type: ${type}`,
    `It expires in 10 minutes.`,
    `If you did not request this, ignore this email.`,
  ].join("\n");

  const transporter = createTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "SMTP is not configured. Set SMTP_USER and SMTP_PASS (Gmail App Password).",
      );
    }

    console.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.info(`[dev OTP] to=${to} type=${type} code=${otp}`);
    console.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const from =
    process.env.SMTP_FROM ||
    `ShiftBOi CMS <${process.env.SMTP_USER}>`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: otpEmailHtml(otp),
    });
    console.info(`[otp] email sent to ${to}`);
  } catch (error) {
    console.error("[otp] failed to send email", error);
    throw new Error(
      "Failed to send OTP email. Check SMTP credentials (use a Gmail App Password).",
    );
  }
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}
