import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import db from "../../config/db";
import { usersTable } from "../../drizzle/schema";
import { sendVerificationEmail } from "../../helpers/email";
import { findUserInDatabase, checkEmailInAdminTable } from "../../helpers/user";
import { signupValidator, verifyOtpValidator } from "../../zod/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const auth = new Hono().basePath("/auth");

auth.post("/signup", zValidator("json", signupValidator), async (c) => {
  const data = await c.req.json();
  const { email, password } = data;
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  // Make token validation consistent with admin auth
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      return c.json({ message: "You are already logged in." }, 401);
    } catch (error) {
      // Token is invalid, continue with signup
    }
  }

  const emailExistsInAdminTable = await checkEmailInAdminTable(email);
  if (emailExistsInAdminTable) {
    return c.json(
      { message: "Email is already used for an admin account!" },
      409
    );
  }

  const existingUser = await findUserInDatabase(email);

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000);

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  if (existingUser) {
    if (existingUser.isVerified) {
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
      isVerified: false,
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

// Add resend verification endpoint for consistency
auth.post(
  "/resend-verification",
  zValidator("json", signupValidator),
  async (c) => {
    const { email } = await c.req.json();

    const user = await findUserInDatabase(email);

    if (!user) {
      return c.json({ message: "User not found." }, 404);
    }

    if (user.isVerified) {
      return c.json({ message: "Account already verified." }, 400);
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationCodeExpires = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(usersTable)
      .set({
        verificationCode,
        verificationCodeExpires,
      })
      .where(eq(usersTable.id, user.id));

    await sendVerificationEmail(email, verificationCode);

    return c.json({
      message: "Verification email sent. Please check your inbox.",
      isVerified: false,
    });
  }
);

// VERIFY OTP ENDPOINT
auth.post("/verify-otp", zValidator("json", verifyOtpValidator), async (c) => {
  try {
    const { email, verificationCode } = await c.req.json();

    // Find the user
    const user = await findUserInDatabase(email);

    // Check if user exists
    if (!user) {
      return c.json({ message: "User not found. Please sign up first." }, 404);
    }

    // Check if user is already verified
    if (user.isVerified) {
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
          message: "Verification code has expired. Please request a new code.",
        },
        400
      );
    }

    // Verify the user
    await db
      .update(usersTable)
      .set({
        isVerified: true,
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
});

// LOGIN ENDPOINT
auth.post("/login", zValidator("json", signupValidator), async (c) => {
  const data = await c.req.json();
  const { email, password } = data;
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  // Make token validation consistent with admin auth
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      return c.json({ message: "You are already logged in." }, 401);
    } catch (error) {
      // Token is invalid, continue with login
    }
  }

  console.log("email:", email);
  console.log("token:", token);

  if (token) {
    return c.json({ message: "You are already logged in." }, 401);
  }

  const user = await findUserInDatabase(email);

  console.log("User found:", user);

  if (!user) {
    return c.json({ message: "User not found!" }, 404);
  }

  if (!user.isVerified) {
    return c.json({ message: "User not verified!" }, 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return c.json({ message: "Invalid password!" }, 401);
  }

  const tokenData = {
    id: user.id,
    email: user.email,
    name: user.name, // Add name to token data for better context
  };

  const authToken = jwt.sign(tokenData, process.env.JWT_SECRET!, {
    expiresIn: "1y",
  });

  return c.json({
    message: "Login successful!",
    token: authToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      balance: user.balance,
    },
  });
});

export default auth;
