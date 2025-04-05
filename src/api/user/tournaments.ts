import { Hono } from "hono";
import {
  getAllUserTournaments,
  getTournamentById,
  getUserTournamentsByName,
  isUserParticipatedInTournament,
  participateInTournament,
} from "../../helpers/user/tournaments";
import { isUser } from "../../middleware/auth";
import { getUser } from "../../utils/context";

const tournamentApi = new Hono().basePath("/tournaments");

tournamentApi.use("/*", isUser);

tournamentApi.get("/", async (c) => {
  try {
    const user = getUser(c);

    const tournaments = await getAllUserTournaments(user.id);
    if (!tournaments) {
      return c.json({ message: "No tournaments found" }, 404);
    }

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

tournamentApi.get("/:id", async (c) => {
  try {
    const user = getUser(c);
    const tournamentId = c.req.param("id");
    if (!tournamentId) {
      return c.json({ error: "Tournament ID is required" }, 400);
    }

    const tournaments = await getTournamentById(user.id, Number(tournamentId));
    if (!tournaments) {
      return c.json({ message: "Tournament not found" }, 404);
    }

    return c.json({
      message: "Tournament retrieved successfully",
      data: tournaments,
    });
  } catch (error) {
    console.error("Error retrieving tournament:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve tournament";
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.post("/participate/:tournamentId", async (c) => {
  try {
    const user = getUser(c);
    const tournamentId = c.req.param("tournamentId");
    if (!tournamentId) {
      return c.json({ error: "Tournament ID is required" }, 400);
    }
    const participate = await participateInTournament(
      Number(tournamentId),
      user.id
    );
    return c.json({
      message: "Successfully participated in the tournament",
      data: participate,
    });
  } catch (error: unknown) {
    console.error("Error participating in tournament:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to participate in tournament";
    return c.json({ error: errorMessage }, 500);
  }
});

tournamentApi.get("/isParticipated/:tournamentId", async (c) => {
  try {
    const user = getUser(c);
    const tournamentId = c.req.param("tournamentId");
    if (!tournamentId) {
      return c.json({ error: "Tournament ID is required" }, 400);
    }

    const participation = await isUserParticipatedInTournament(
      Number(tournamentId),
      user.id
    );

    return c.json({
      message: "Participation status retrieved successfully",
      data: participation,
    });
  } catch (error) {
    console.error("Error checking participation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to check participation";
    return c.json({ error: errorMessage }, 500);
  }
});


tournamentApi.get("/game/:name", async (c) => {
  try {
    const user = getUser(c);
    const gameName = c.req.param("name");
    if (!gameName) {
      return c.json({ error: "Game name is required" }, 400);
    }

    const tournaments = await getUserTournamentsByName(user.id, gameName);
    if (!tournaments) {
      return c.json({ message: "No tournaments found" }, 404);
    }
    return c.json({
      message: "Tournaments retrieved successfully",
      tournaments,
    });
  } catch (error) {
    console.error("Error retrieving tournaments:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve tournaments";
    return c.json({ error: errorMessage }, 500);
  }
});

export default tournamentApi;
