import { Hono } from "hono";
import { cors } from "hono/cors";
import admin from "./api/admin";
import user from "./api/user";
import "./types"; 
import game from "./api/games";

const app = new Hono().basePath("/api");

app.use("*", cors({
  origin: ["https://battlezonex.in", "http://localhost:5173"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
}));


app.route("/", admin);
app.route("/", user);
app.route("/", game);
app.post("/hello", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default app;
