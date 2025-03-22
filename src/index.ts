import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono().basePath("/api");

app.use("*", cors({ origin: "*" }));

app.post("/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
