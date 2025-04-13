import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import db from "../../config/db";
import { depositTable, withdrawTable } from "../../drizzle/schema";
import { findUserById } from "../../helpers/user/user";
import { isUser } from "../../middleware/auth";
import { getUser } from "../../utils/context";

const transaction = new Hono().basePath("/transaction");

const depositValidator = z.object({
  amount: z.number().positive("Amount must be positive"),
  transactionId: z.number().positive("Transaction ID is required"),
  upiId: z.string().min(1, "UPI ID is required"),
});

const withdrawValidator = z.object({
  amount: z.number().positive("Amount must be positive"),
  upiId: z.string().min(1, "UPI ID is required"),
});

transaction.use("/*", isUser);

transaction.post(
  "/deposit",
  zValidator("json", depositValidator),
  async (c) => {
    try {
      const { amount, transactionId, upiId } = await c.req.json();
      const user = getUser(c);
      const userProfile = await findUserById(user.id.toString());

      if (!userProfile) {
        return c.json({ message: "User not found!" }, 404);
      }

      await db
        .insert(depositTable)
        .values({
          userId: user.id,
          amount,
          transactionId,
          upiId,
          status: "pending",
          createdAt: new Date(),
        })
        .execute();

      return c.json({
        message: "Deposit request submitted successfully!",
        transactionAmount: amount,
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      return c.json(
        {
          message: "Failed to process deposit",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

transaction.post(
  "/withdraw",
  zValidator("json", withdrawValidator),
  async (c) => {
    try {
      const { amount, upiId } = await c.req.json();
      const user = getUser(c);

      const userProfile = await findUserById(user.id.toString());

      if (!userProfile) {
        return c.json({ message: "User not found!" }, 404);
      }

      if (userProfile.balance < amount) {
        return c.json({ message: "Insufficient balance!" }, 400);
      }
      await db
        .insert(withdrawTable)
        .values({
          userId: user.id,
          amount,
          upiId,
          status: "pending",
          createdAt: new Date(),
        })
        .execute();

      return c.json({
        message: "Withdrawal request submitted successfully!",
        transactionAmount: amount,
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      return c.json(
        {
          message: "Failed to process withdrawal",
          error: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  }
);

export default transaction;
