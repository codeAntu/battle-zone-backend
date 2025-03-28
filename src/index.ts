import { Hono } from "hono";
import { cors } from "hono/cors";
import signup from "./api/auth/signup";

const app = new Hono().basePath("/api");

app.use("*", cors({ origin: "*" }));

app.route("/", signup);

app.post("/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
