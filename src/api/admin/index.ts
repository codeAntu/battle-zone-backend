import { Hono } from "hono";
import tournamentApi from "./tournaments";
import adminAuth from "./auth";
import gamesRouter from "./games";

const admin = new Hono().basePath("/admin");

admin.route("/", tournamentApi);
admin.route("/", adminAuth);
admin.route("/", gamesRouter);

admin.get("/", (c) => {
  return c.json({ message: "Admin API" });
});

export default admin;
