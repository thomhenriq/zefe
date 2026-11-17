import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    emailOTP({
      otpLength: 6,
      // shortcut: OTP guardado em texto puro, só para uso local; trocar para hash antes de publicar
      storeOTP: "plain",
      // shortcut: código só no terminal do servidor, sem provedor de e-mail; ligar envio real antes de publicar
      async sendVerificationOTP({ email, otp }) {
        console.log(`[zefe] código de entrada para ${email}: ${otp}`);
      },
    }),
    nextCookies(),
  ],
});

export const handler = toNextJsHandler(auth);
