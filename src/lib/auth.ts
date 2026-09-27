import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { ADMIN_EMAIL, isAllowedAdminEmail } from "@/lib/constants";

const appUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function originCandidates(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const origins = [u.origin];
    if (host.startsWith("www.")) {
      origins.push(`${u.protocol}//${host.slice(4)}`);
    } else if (host.includes(".")) {
      origins.push(`${u.protocol}//www.${host}`);
    }
    return origins;
  } catch {
    return [url];
  }
}

export const auth = betterAuth({
  appName: "WebPort v2",
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  // Dev often runs on :3001 when :3000 is busy — trust both local origins
  trustedOrigins: [
    ...originCandidates(appUrl),
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://shiftboi.xyz",
    "https://www.shiftboi.xyz",
  ].filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: false,
  },
  user: {
    additionalFields: {},
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isAllowedAdminEmail(user.email)) {
            throw new Error("This email is not authorized for CMS access.");
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      disableSignUp: false,
      storeOTP: "plain",
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (!isAllowedAdminEmail(email)) {
          throw new Error("This email is not authorized for CMS access.");
        }
        await sendOtpEmail({ to: email, otp, type });
      },
    }),
    passkey({
      rpID: process.env.PASSKEY_RP_ID || "localhost",
      rpName: process.env.PASSKEY_RP_NAME || "WebPort v2",
      origin: appUrl,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

export { ADMIN_EMAIL };
