import { Hono } from "hono";
import tournamentApi from "./tournaments";
import adminAuth from "./auth";
import gamesRouter from "./games";
import transactionsRouter from "./transactions";
import usersRouter from "./users";

const admin = new Hono().basePath("/admin");

admin.route("/", tournamentApi);
admin.route("/", adminAuth);
admin.route("/", gamesRouter);
admin.route("/", transactionsRouter);
admin.route("/", usersRouter);

admin.get("/", (c) => {
  return c.json({ message: "Admin API" });
});

export default admin;
