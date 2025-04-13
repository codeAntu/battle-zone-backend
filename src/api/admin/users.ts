import { Hono } from "hono";
import db from "../../config/db";
import { isAdmin } from "../../middleware/auth";
import { getAdmin } from "../../utils/context";
import { usersTable } from "../../drizzle/schema";

const usersRouter = new Hono().basePath("/users");

usersRouter.use("/*", isAdmin);

usersRouter.get("/", async (c) => {
  try {
    const users = await db.select().from(usersTable).execute();
    const admin = getAdmin(c);

    console.log("Admin ID:", admin.id);
    return c.json(
      {
        users,
      },
      200
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json(
      {
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});

export default usersRouter;
