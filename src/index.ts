import { Hono } from "hono";
import { cors } from "hono/cors";
import admin from "./api/admin";
import user from "./api/user";
import "./types"; // Make sure this import exists
import game from "./api/games";

const app = new Hono().basePath("/api");

app.use("*", cors({ origin: "*" }));

// Use the centralized auth router
app.route("/", admin);
app.route("/", user);
app.route("/", game);
app.post("/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
