import nodemailer from "nodemailer";

type SendOtpArgs = {
  to: string;
  otp: string;
  type: string;
};

export async function sendOtpEmail({ to, otp, type }: SendOtpArgs): Promise<void> {
  const subject = `Your WebPort code: ${otp}`;
  const text = [
    `Your one-time code is ${otp}.`,
    `Type: ${type}`,
    `It expires in 10 minutes.`,
    `If you did not request this, ignore this email.`,
  ].join("\n");

  const host = process.env.SMTP_HOST;

  if (!host) {
    console.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.info(`[dev OTP] to=${to} type=${type} code=${otp}`);
    console.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "WebPort <noreply@localhost>",
    to,
    subject,
    text,
  });
}
