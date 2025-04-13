import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createTournament,
  endTournament,
  getMyCurrentTournaments,
  getMyTournamentById,
  getMyTournamentHistory,
  getMyTournaments,
  getTournamentParticipants,
  updateTournamentRoomId,
  awardKillMoney,
} from "../../helpers/admin/tournaments";
import { isAdmin } from "../../middleware/auth";
import { getAdmin } from "../../utils/context";
import {
  tournamentsValidation,
  tournamentUpdateValidation,
  killMoneyValidation, 
} from "../../zod/tournaments";

const tournamentApi = new Hono().basePath("/tournaments");

tournamentApi.use("/*", isAdmin);

tournamentApi.get("/", async (c) => {
  try {
    const admin = getAdmin(c);
    const tournaments = await getMyTournaments(admin.id);
    return c.json({
      message: "Tournaments retrieved successfully",
      tournaments,
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
      tournaments,
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
      tournaments,
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

      console.log("data", data);

      const tournamentId = await createTournament(admin.id, data);

      const tournament = await getMyTournamentById(admin.id, tournamentId);

      return c.json({
        message: "Tournament created successfully",
        tournament,
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
      return c.json({
        message: "Tournament updated successfully",
        id,
        result,
      });
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
    const { winnerId } = await c.req.json();
    const tournament = await endTournament(admin.id, id, winnerId);
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

tournamentApi.post(
  "/kills/:id",
  zValidator("json", killMoneyValidation),
  async (c) => {
    try {
      const admin = getAdmin(c);
      const id = Number(c.req.param("id"));
      const { userId, kills } = await c.req.json();

      const result = await awardKillMoney(admin.id, id, userId, kills);

      return c.json({
        message: "Kill money awarded successfully",
        result,
      });
    } catch (error: unknown) {
      console.error("Error awarding kill money:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to award kill money";

      if (errorMessage.includes("not found")) {
        return c.json({ error: errorMessage }, 404);
      }
      return c.json({ error: errorMessage }, 500);
    }
  }
);

tournamentApi.get("/participants/:id", async (c) => {
  try {
    const admin = getAdmin(c);
    const id = Number(c.req.param("id"));
    console.log(`Admin ${admin.id} accessing tournament ${id}`);

    const tournamentParticipants = await getTournamentParticipants(
      admin.id,
      id
    );

    return c.json({
      message: "Get Tournament Participants",
      participants: tournamentParticipants,
    });
  } catch (error: unknown) {
    console.error("Error retrieving tournament participants:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to retrieve tournament participants";
    return c.json({ error: errorMessage }, 500);
  }
});

export default tournamentApi;
