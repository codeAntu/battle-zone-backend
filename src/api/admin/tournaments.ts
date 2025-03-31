import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  tournamentsValidation,
  tournamentUpdateValidation,
} from "../../zod/tournaments";
import { isAdmin } from "../../middleware/auth";
import {
  createTournament,
  updateTournamentRoomId,
  getAllTournaments,
  getTournamentById,
} from "../../helpers/tournaments";

const tournamentApi = new Hono().basePath("/tournaments");

tournamentApi.get("/", isAdmin, async (c) => {
  try {
    const tournaments = await getAllTournaments();
    return c.json({ message: "Tournaments retrieved successfully", data: tournaments });
  } catch (error: unknown) {
    console.error("Error retrieving tournaments:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve tournaments";
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.get("/:id", isAdmin, async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const tournament = await getTournamentById(id);
    return c.json({ message: "Tournament retrieved successfully", data: tournament });
  } catch (error: unknown) {
    console.error("Error retrieving tournament:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve tournament";
    
    if (errorMessage.includes("not found")) {
      return c.json({ error: errorMessage }, 404);
    }
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.post(
  "/create",
  isAdmin,
  zValidator("json", tournamentsValidation),
  async (c) => {
    try {
      const data = await c.req.json();
      const result = await createTournament(data);
      return c.json({ message: "Create Tournament", result });
    } catch (error: unknown) {
      console.error("Error creating tournament:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create tournament";
      return c.json({ error: errorMessage }, 500);
    }
  }
);

tournamentApi.post(
  "/update/:id",
  isAdmin,
  zValidator("json", tournamentUpdateValidation),
  async (c) => {
    try {
      const id = Number(c.req.param("id"));
      const data = await c.req.json();

      const result = await updateTournamentRoomId(id, data);
      return c.json({ message: "Tournament updated successfully", id, result });
    } catch (error: unknown) {
      console.error("Error updating tournament:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update tournament";

      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      return c.json({ error: errorMessage }, 500);
    }
  }
);

tournamentApi.delete("/delete/:id", isAdmin, async (c) => {
  try {
    const id = c.req.param("id");
    // Implement your delete logic here

    return c.json({ message: "Delete Tournament", id });
  } catch (error: unknown) {
    console.error("Error deleting tournament:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete tournament";
    return c.json({ error: errorMessage }, 500);
  }
});

export default tournamentApi;
