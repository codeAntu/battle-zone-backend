import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createTournament,
  endTournament,
  getMyCurrentTournaments,
  getMyTournamentById,
  getMyTournamentHistory,
  getMyTournaments,
  updateTournamentRoomId,
} from "../../helpers/tournaments";
import { isAdmin } from "../../middleware/auth";
import { getAdmin } from "../../utils/context";
import {
  tournamentsValidation,
  tournamentUpdateValidation,
} from "../../zod/tournaments";

const tournamentApi = new Hono().basePath("/tournaments");

tournamentApi.use("/*", isAdmin);

tournamentApi.get("/", async (c) => {
  try {
    const admin = getAdmin(c);
    const tournaments = await getMyTournaments(admin.id);
    return c.json({
      message: "Tournaments retrieved successfully",
      data: tournaments,
    });
  } catch (error: unknown) {
    console.error("Error retrieving tournaments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve tournaments";
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.get("/history", async (c) => {
  try {
    const admin = getAdmin(c);
    const tournaments = await getMyTournamentHistory(admin.id);
    return c.json({
      message: "Tournaments retrieved successfully",
      data: tournaments,
    });
  } catch (error: unknown) {
    console.error("Error retrieving tournaments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve tournaments";
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.get("/current", async (c) => {
  try {
    const admin = getAdmin(c);
    const tournaments = await getMyCurrentTournaments(admin.id);
    return c.json({
      message: "Current tournaments retrieved successfully",
      data: tournaments,
    });
  } catch (error: unknown) {
    console.error("Error retrieving current tournaments:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve current tournaments";
    return c.json({ error: errorMessage }, 500);
  }
});

// get current tournament

tournamentApi.get("/:id", async (c) => {
  try {
    const admin = getAdmin(c);
    const id = Number(c.req.param("id"));
    console.log(`Admin ${admin.id} accessing tournament ${id}`);

    const tournament = await getMyTournamentById(admin.id, id);
    return c.json({
      message: "Tournament retrieved successfully",
      tournament,
    });
  } catch (error: unknown) {
    console.error("Error retrieving tournament:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve tournament";

    if (errorMessage.includes("not found")) {
      return c.json({ error: errorMessage }, 404);
    }
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.post(
  "/create",
  zValidator("json", tournamentsValidation),
  async (c) => {
    try {
      const data = await c.req.json();
      const admin = getAdmin(c);

      const result = await createTournament(admin.id, data);
      return c.json({
        message: "Tournament created successfully",
        data: result,
      });
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
  zValidator("json", tournamentUpdateValidation),
  async (c) => {
    try {
      const admin = getAdmin(c);
      const id = Number(c.req.param("id"));
      const data = await c.req.json();
      const result = await updateTournamentRoomId(admin.id, id, data);
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

tournamentApi.post("/end/:id", async (c) => {
  try {
    const admin = getAdmin(c);
    const id = Number(c.req.param("id"));
    console.log(`Admin ${admin.id} ending tournament ${id}`);

    const tournament = await endTournament(admin.id, id);

    return c.json({
      message: "End Tournament",
      tournament,
    });
  } catch (error: unknown) {
    console.error("Error ending tournament:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to end tournament";
    return c.json({ error: errorMessage }, 500);
  }
});

// tournamentApi.delete("/delete/:id", async (c) => {
//   try {
//     const admin = getAdmin(c);
//     const id = c.req.param("id");

//     console.log(`Admin ${admin.id} deleting tournament ${id}`);

//     // Implement your delete logic here

//     return c.json({
//       message: "Delete Tournament",
//       id,
//       adminId: admin.id,
//     });
//   } catch (error: unknown) {
//     console.error("Error deleting tournament:", error);
//     const errorMessage =
//       error instanceof Error ? error.message : "Failed to delete tournament";
//     return c.json({ error: errorMessage }, 500);
//   }
// });

export default tournamentApi;
