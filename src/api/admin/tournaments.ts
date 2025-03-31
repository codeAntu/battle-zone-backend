import { Hono } from "hono";

const tournamentApi = new Hono().basePath("/tournaments");

tournamentApi.get("/", (c) => {
  return c.json({ message: "Tournament API" });
});
tournamentApi.get("/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ message: `Get Tournament with ID: ${id}` });
});

tournamentApi.post("/create", (c) => {
  return c.json({ message: "Create Tournament" });
});

tournamentApi.post("/update", (c) => {
  return c.json({ message: "Update Tournament" });
});

tournamentApi.get("/delete", (c) => {
  return c.json({ message: "Delete Tournament" });
});

export default tournamentApi;
