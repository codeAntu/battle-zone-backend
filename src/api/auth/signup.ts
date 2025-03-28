import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import db from "../../config/db";
import { usersTable } from "../../drizzle/schema";
import { sendVerificationEmail } from "../../helpers/email";
import { findUserInDatabase } from "../../helpers/user";
import { signupValidator } from "../../zod/auth";
import bcrypt from "bcryptjs";

const signup = new Hono().basePath("/auth");

signup.post("/signup", zValidator("json", signupValidator), async (c) => {
  const data = await c.req.json();
  const { email, password } = data;
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return c.json({ message: "Authorization token is missing!" }, 401);
  }

  const existingUser = await findUserInDatabase(email);

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000);

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingUser) {
    if (existingUser.isVerified === 1) {
      return c.json({ message: "User already exists and is verified!" }, 409);
    } else {
      console.log(
        "User exists but not verified, resending verification email."
      );

      await db
        .update(usersTable)
        .set({
          password: hashedPassword,
          verificationCode: verificationCode,
          verificationCodeExpires: verificationCodeExpires,
        })
        .where(eq(usersTable.id, existingUser.id));

      await sendVerificationEmail(email, verificationCode);

      return c.json({
        message: "Verification email resent. Please check your inbox.",
        isVerified: false,
      });
    }
  }

  try {
    const userData = {
      email,
      name: email.split("@")[0],
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
      isVerified: 0,
      balance: 0,
    };

    const newUser = await db.insert(usersTable).values(userData);

    await sendVerificationEmail(email, verificationCode);

    return c.json(
      {
        message: "Signup successful! Please verify your email.",
        title: "User created successfully",
        isVerified: false,
        user: newUser,
      },
      201
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json(
      {
        message: "Failed to create user. Please try again.",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default signup;
