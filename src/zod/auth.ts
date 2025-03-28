import { z } from "zod";

const signupValidator = z
  .object({
    email: z
      .string({ required_error: "Email is required" }) //
      .trim()
      .toLowerCase()
      .email({ message: "Invalid email format" }),
    password: z
      .string({ required_error: "Password is required" })
      .trim()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(100, { message: "Password must be at most 100 characters long" }),
  })
  .strict();

export { signupValidator };
