import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { ADMIN_EMAIL, isAllowedAdminEmail } from "@/lib/constants";

export const auth = betterAuth({
  appName: "WebPort v2",
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
  secret: process.env.BETTER_AUTH_SECRET,
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
      origin: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;

export { ADMIN_EMAIL };
