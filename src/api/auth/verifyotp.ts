import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import db from "../../config/db";
import { usersTable } from "../../drizzle/schema";
import { findUserInDatabase } from "../../helpers/user";

// Define the OTP verification validator schema
export const verifyOtpValidator = z
  .object({
    email: z
      .string({ required_error: "Email is required" }) //
      .trim()
      .toLowerCase()
      .email({ message: "Invalid email format" }),
    verificationCode: z
      .string({ required_error: "OTP is required" })
      .trim()
      .min(6, { message: "OTP must be at least 6 characters long" })
      .max(6, { message: "OTP must be at most 6 characters long" }),
  })
  .strict()
  .refine((data) => data.email || data.verificationCode, {
    message: "Email and OTP is required",
  });

const verifyOtp = new Hono().basePath("/auth");

verifyOtp.post(
  "/verify-otp",
  zValidator("json", verifyOtpValidator),
  async (c) => {
    try {
      const { email, verificationCode } = await c.req.json();

      // Find the user
      const user = await findUserInDatabase(email);

      // Check if user exists
      if (!user) {
        return c.json(
          { message: "User not found. Please sign up first." },
          404
        );
      }

      // Check if user is already verified
      if (user.isVerified === 1) {
        return c.json(
          { message: "Account already verified. Please login." },
          200
        );
      }

      // Check if verification code is correct
      if (user.verificationCode !== verificationCode) {
        return c.json({ message: "Invalid verification code." }, 400);
      }

      // Check if verification code is expired
      const now = new Date();
      if (now > user.verificationCodeExpires) {
        return c.json(
          {
            message:
              "Verification code has expired. Please request a new code.",
          },
          400
        );
      }

      // Verify the user
      await db
        .update(usersTable)
        .set({
          isVerified: 1,
          verificationCode: "", // Clear verification code after successful verification
        })
        .where(eq(usersTable.id, user.id));

      return c.json(
        {
          message: "Account verified successfully. You can now login.",
          isVerified: true,
        },
        200
      );
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return c.json(
        {
          message: "Failed to verify account. Please try again.",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

export default verifyOtp;
