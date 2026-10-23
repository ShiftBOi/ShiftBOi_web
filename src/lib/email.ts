import nodemailer from "nodemailer";

type SendOtpArgs = {
  to: string;
  otp: string;
  type: string;
};

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER?.trim();
  // Gmail App Passwords are often copied with spaces — strip them
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");

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

export type InquiryMailPayload = {
  to: string;
  name: string | null;
  email: string;
  message: string | null;
  source: string;
};

/**
 * Notify inbox + optional confirm to sender.
 * Never throws to the public form — failures are logged and returned as flags.
 */
export async function sendInquiryEmails(
  payload: InquiryMailPayload,
): Promise<{ notified: boolean; confirmed: boolean }> {
  const transporter = createTransporter();
  const name = payload.name?.trim() || "Someone";
  const message = payload.message?.trim() || "(no message)";
  const from =
    process.env.SMTP_FROM ||
    `ShiftBOi <${process.env.SMTP_USER || "noreply@localhost"}>`;

  if (!transporter) {
    console.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.info(`[dev inquiry] to=${payload.to}`);
    console.info(`from=${name} <${payload.email}> source=${payload.source}`);
    console.info(message);
    console.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { notified: false, confirmed: false };
  }

  let notified = false;
  let confirmed = false;

  try {
    await transporter.sendMail({
      from,
      to: payload.to,
      replyTo: payload.email,
      subject: `New inquiry from ${name}`,
      text: [
        `New Get in Touch inquiry`,
        `Name: ${name}`,
        `Email: ${payload.email}`,
        `Source: ${payload.source}`,
        "",
        message,
      ].join("\n"),
      html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#0a0a0a;font-family:system-ui,sans-serif;color:#fff;">
  <div style="max-width:520px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:24px;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#8b5cf6;">Get in touch</p>
    <h1 style="margin:0 0 16px;font-size:20px;">New inquiry from ${escapeHtml(name)}</h1>
    <p style="margin:0 0 8px;color:#a3a3a3;font-size:14px;"><strong style="color:#fff;">Email:</strong> ${escapeHtml(payload.email)}</p>
    <p style="margin:0 0 16px;color:#a3a3a3;font-size:14px;"><strong style="color:#fff;">Source:</strong> ${escapeHtml(payload.source)}</p>
    <p style="margin:0;white-space:pre-wrap;line-height:1.5;font-size:15px;">${escapeHtml(message)}</p>
  </div>
</body></html>`,
    });
    notified = true;
  } catch (error) {
    console.error("[inquiry] notify email failed", error);
  }

  try {
    await transporter.sendMail({
      from,
      to: payload.email,
      subject: "Thanks — ShiftBOi received your message",
      text: `Hi ${name},\n\nThanks for reaching out. I received your note and will reply soon.\n\n— ShiftBOi`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#0a0a0a;font-family:system-ui,sans-serif;color:#fff;">
  <div style="max-width:520px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:8px;padding:24px;">
    <p style="margin:0 0 12px;font-size:18px;font-weight:600;">Thanks, ${escapeHtml(name)}</p>
    <p style="margin:0;color:#a3a3a3;font-size:14px;line-height:1.55;">I received your message and will get back to you soon.</p>
    <p style="margin:20px 0 0;color:#757575;font-size:13px;">— ShiftBOi</p>
  </div>
</body></html>`,
    });
    confirmed = true;
  } catch (error) {
    console.error("[inquiry] confirm email failed", error);
  }

  return { notified, confirmed };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
