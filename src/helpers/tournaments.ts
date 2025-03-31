import { eq } from "drizzle-orm";
import db from "../config/db";
import { tournamentsTable } from "../drizzle/schema";
import { TournamentType, TournamentUpdateType } from "../zod/tournaments";

export async function createTournament(data: TournamentType) {
  const result = await db
    .insert(tournamentsTable)
    .values({
      game: data.game as "PUBG" | "FREEFIRE",
      name: data.name,
      description: data.description || null,
      roomId: Number(data.roomId),
      entryFee: Number(data.entryFee),
      prize: Number(data.prize),
      perKillPrize: Number(data.perKillPrize),
      maxParticipants: Number(data.maxParticipants),
      date: new Date(data.date),
      time: new Date(data.time),
    })
    .execute();

  return result;
}

export async function updateTournamentRoomId(
  id: number,
  data: TournamentUpdateType
) {
  console.log("Update data:", data); // Debugging line

  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid tournament ID: ${id}`);
  }

  try {
    // First check if tournament exists
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .execute();

    if (!tournament.length) {
      throw new Error(`Tournament with ID ${id} not found`);
    }

    const result = await db
      .update(tournamentsTable)
      .set({
        roomId: data.roomId ? Number(data.roomId) : undefined,
      })
      .where(eq(tournamentsTable.id, id));

    return result;
  } catch (error) {
    console.error("Error updating tournament:", error); // Debugging line
    throw error; // Pass the error up to be handled by the API
  }
}

/**
 * Get all tournaments from the database
 */
export async function getAllTournaments() {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .orderBy(tournamentsTable.date)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }
}

/**
 * Get a specific tournament by ID
 */
export async function getTournamentById(id: number) {
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid tournament ID: ${id}`);
  }

  try {
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .execute();

    if (!tournament.length) {
      throw new Error(`Tournament with ID ${id} not found`);
    }

    return tournament[0];
  } catch (error) {
    console.error(`Error fetching tournament with ID ${id}:`, error);
    throw error;
  }
}
