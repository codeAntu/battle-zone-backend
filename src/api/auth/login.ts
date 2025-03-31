import { zValidator } from "@hono/zod-validator";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { findUserInDatabase } from "../../helpers/user";
import { signupValidator } from "../../zod/auth";
import jwt from "jsonwebtoken";

const login = new Hono().basePath("/auth");

login.post("/login", zValidator("json", signupValidator), async (c) => {
  const data = await c.req.json();
  const { email, password } = data;
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

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

  if (user.isVerified === 0) {
    return c.json({ message: "User not verified!" }, 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return c.json({ message: "Invalid password!" }, 401);
  }

  const tokenData = {
    id: user.id,
    email: user.email,
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

export default login;
