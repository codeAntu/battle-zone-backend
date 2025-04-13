import { Hono } from "hono";
import tournamentApi from "./tournaments";
import auth from "./auth";
import profile from "./profile";
import transaction from "./transection";

const user = new Hono().basePath("/user");

user.route("/", auth);
user.route("/", tournamentApi);
user.route("/", profile);
user.route("/", transaction);

export default user;