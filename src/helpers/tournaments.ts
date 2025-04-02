import { and, eq } from "drizzle-orm";
import db from "../config/db";
import {
  tournamentParticipantsTable,
  tournamentsTable,
  withdrawTable,
} from "../drizzle/schema";
import { TournamentType, TournamentUpdateType } from "../zod/tournaments";

export async function createTournament(adminId: number, data: TournamentType) {
  const result = await db
    .insert(tournamentsTable)
    .values({
      adminId: adminId,
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
  adminId: number,
  id: number,
  data: TournamentUpdateType
) {
  if (isNaN(id) || id <= 0) {
    throw new Error(`Invalid tournament ID: ${id}`);
  }

  try {
    const result = await db
      .update(tournamentsTable)
      .set({
        roomId: Number(data.roomId),
      })
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    // Check if any rows were affected by the update
    if (!result || result[0].affectedRows === 0) {
      throw new Error(`Tournament with ID ${id} not found for this admin`);
    }

    // Get the updated tournament
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    return tournament[0];
  } catch (error) {
    console.error("Error updating tournament:", error);
    throw error;
  }
}

export async function getMyTournaments(adminId: number) {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.adminId, adminId))
      .orderBy(tournamentsTable.date)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    throw error;
  }
}

export async function getMyTournamentById(adminId: number, id: number) {
  try {
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      );

    if (!tournament.length) {
      throw new Error(`Tournament with ID ${id} not found`);
    }

    return tournament[0];
  } catch (error) {
    console.error(`Error fetching tournament with ID ${id}:`, error);
    throw error;
  }
}

export async function getMyTournamentHistory(adminId: number) {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(
          eq(tournamentsTable.adminId, adminId),
          eq(tournamentsTable.isEnded, true)
        )
      )
      .orderBy(tournamentsTable.date)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournament history:", error);
    throw error;
  }
}

export async function endTournament(adminId: number, id: number) {
  try {
    const result = await db
      .update(tournamentsTable)
      .set({
        isEnded: true,
      })
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    // Check if any rows were affected by the update
    if (!result || result[0].affectedRows === 0) {
      throw new Error(`Tournament with ID ${id} not found for this admin`);
    }

    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    // todo -> choose winner

    return tournament[0];
  } catch (error) {
    console.error("Error ending tournament:", error);
    throw error;
  }
}

export async function getMyCurrentTournaments(adminId: number) {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(
          eq(tournamentsTable.adminId, adminId),
          eq(tournamentsTable.isEnded, false)
        )
      )
      .orderBy(tournamentsTable.date)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching current tournaments:", error);
    throw error;
  }
}

export async function getAllUserTournaments(userId: number) {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .leftJoin(
        tournamentParticipantsTable,
        eq(tournamentParticipantsTable.tournamentId, tournamentsTable.id)
      )
      .where(
        and(
          eq(tournamentParticipantsTable.userId, userId),
          eq(tournamentsTable.isEnded, false)
        )
      )
      .orderBy(tournamentsTable.date)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching all user tournaments:", error);
    throw error;
  }
}

export async function getTournamentById(userId: number, id: number) {
  try {
    // Fetch the tournament details
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, id))
      .execute();

    if (!tournament || tournament.length === 0) {
      throw new Error(`Tournament with ID ${id} does not exist`);
    }

    const tournamentData = tournament[0];

    // Check if the user has participated in the tournament
    const participation = await db
      .select()
      .from(tournamentParticipantsTable)
      .where(
        and(
          eq(tournamentParticipantsTable.tournamentId, id),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .execute();

    const hasParticipated = participation && participation.length > 0;

    // Check if the tournament has ended
    if (tournamentData.isEnded) {
      // Fetch the winners from the withdrawTable
      const winners = await db
        .select()
        .from(withdrawTable)
        .where(eq(withdrawTable.tournamentId, id))
        .execute();

      return {
        tournament: tournamentData,
        winners,
        hasParticipated,
      };
    }

    return {
      tournament: tournamentData,
      hasParticipated,
      message: "Tournament is still ongoing",
    };
  } catch (error) {
    console.error("Error fetching tournament by ID:", error);
    throw error;
  }
}

export async function participateInTournament(
  tournamentId: number,
  userId: number
) {
  try {
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(eq(tournamentsTable.id, tournamentId))
      .execute();

    if (!tournament || tournament.length === 0) {
      throw new Error(`Tournament with ID ${tournamentId} does not exist`);
    }

    const existingParticipant = await db
      .select()
      .from(tournamentParticipantsTable)
      .where(
        and(
          eq(tournamentParticipantsTable.tournamentId, tournamentId),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .execute();

    if (existingParticipant && existingParticipant.length > 0) {
      throw new Error(
        `User with ID ${userId} has already participated in tournament ${tournamentId}`
      );
    }

    const result = await db
      .insert(tournamentParticipantsTable)
      .values({ tournamentId, userId })
      .execute();

    return result;
  } catch (error) {
    console.error("Error participating in tournament:", error);
    throw error;
  }
}
