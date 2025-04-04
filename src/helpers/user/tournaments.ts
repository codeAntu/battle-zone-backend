import { and, eq } from "drizzle-orm";
import db from "../../config/db";
import {
  tournamentParticipantsTable,
  tournamentsTable,
  withdrawTable,
} from "../../drizzle/schema";
import { MySqlColumn } from "drizzle-orm/mysql-core";

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
      .orderBy(tournamentsTable.scheduledAt)
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

export async function getUserTournamentsByName(
  userId: number,
  gameName: string
) {
  try {
    const tournaments = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(
          eq(tournamentsTable.game, gameName as "PUBG" | "FREEFIRE"),
          eq(tournamentsTable.isEnded, false)
        )
      )
      .execute();
    // todo :- remove participated tournaments
    

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments by game name:", error);
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
