import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUser, findUserInDatabase } from "../../helpers/user";
import { signupValidator } from "../../zod/auth";
import { sendVerificationEmail } from "../../helpers/email";

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

  if (existingUser) {
    return c.json({ message: "User already exists!" }, 409);
  }

  return c.json(
    {
      message: "Signup successful!",
      title: "User created successfully",
    },
    201
  );
});

export default signup;
