import { Hono } from "hono";
import { cors } from "hono/cors";
import auth from "./api/auth";  // Import the centralized auth router
import profile from "./api/profile";
import admin from "./api/admin";

const app = new Hono().basePath("/api");

app.use("*", cors({ origin: "*" }));

// Use the centralized auth router
app.route("/", auth);
app.route("/", profile);
app.route("/" , admin);

app.post("/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
