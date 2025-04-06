import { and, eq, gt, isNull } from "drizzle-orm";
import db from "../../config/db";
import {
  tournamentParticipantsTable,
  tournamentsTable,
  usersTable,
  historyTable,
} from "../../drizzle/schema";

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
          eq(tournamentsTable.isEnded, false),
          gt(tournamentsTable.scheduledAt, new Date())
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
    // Validate that id is a valid number
    if (isNaN(id) || id <= 0) {
      throw new Error("Invalid tournament ID provided");
    }
    
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
      // Fetch the winners from the historyTable
      const winners = await db
        .select()
        .from(historyTable)
        .where(eq(historyTable.tournamentId, id))
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
      .select({
        tournament: tournamentsTable,
      })
      .from(tournamentsTable)
      .leftJoin(
        tournamentParticipantsTable,
        and(
          eq(tournamentParticipantsTable.tournamentId, tournamentsTable.id),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .where(
        and(
          eq(tournamentsTable.game, gameName as "PUBG" | "FREEFIRE"),
          eq(tournamentsTable.isEnded, false),
          isNull(tournamentParticipantsTable.id),
          gt(tournamentsTable.scheduledAt, new Date())
        )
      )
      .execute();

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
      .where(
        and(
          eq(tournamentsTable.id, tournamentId),
          eq(tournamentsTable.isEnded, false),
          gt(tournamentsTable.scheduledAt, new Date())
        )
      )
      .execute();

    if (!tournament || tournament.length === 0) {
      throw new Error(`Tournament does not exist`);
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
      throw new Error(`Already participated in tournament`);
    }

    const maxParticipants = tournament[0].maxParticipants;

    const currentParticipants = await db
      .select()
      .from(tournamentParticipantsTable)
      .where(eq(tournamentParticipantsTable.tournamentId, tournamentId))
      .execute();

    const currentParticipantsCount = currentParticipants.length;
    if (currentParticipantsCount >= maxParticipants) {
      throw new Error(`Tournament has reached its maximum participants`);
    }

    // check balance of user
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (!user || user.length === 0) {
      throw new Error(`User does not exist`);
    }

    const userBalance = user[0].balance;

    const tournamentEntryFee = tournament[0].entryFee;
    if (userBalance < tournamentEntryFee) {
      throw new Error(
        "Don't have enough balance to participate in this tournament"
      );
    }

    await db
      .update(usersTable)
      .set({
        balance: userBalance - tournamentEntryFee,
      })
      .where(and(eq(usersTable.id, userId)))
      .execute();

    const participantInsert = await db
      .insert(tournamentParticipantsTable)
      .values({
        tournamentId,
        userId,
      })
      .execute();

    await db
      .update(tournamentsTable)
      .set({
        currentParticipants: currentParticipantsCount + 1,
      })
      .where(eq(tournamentsTable.id, tournamentId))
      .execute();

    return participantInsert;
  } catch (error) {
    console.error("Error participating in tournament:", error);
    throw error;
  }
}

export async function isUserParticipatedInTournament(
  tournamentId: number,
  userId: number
) {
  try {
    const participation = await db
      .select()
      .from(tournamentParticipantsTable)
      .where(
        and(
          eq(tournamentParticipantsTable.tournamentId, tournamentId),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .execute();

    return participation && participation.length > 0;
  } catch (error) {
    console.error("Error checking user participation:", error);
    throw error;
  }
}

export async function getParticipatedTournaments(userId: number) {
  try {
    // Get tournaments the user has participated in
    const tournaments = await db
      .select({
        id: tournamentsTable.id,
        adminId: tournamentsTable.adminId,
        game: tournamentsTable.game,
        name: tournamentsTable.name,
        description: tournamentsTable.description,
        roomId: tournamentsTable.roomId,
        entryFee: tournamentsTable.entryFee,
        prize: tournamentsTable.prize,
        perKillPrize: tournamentsTable.perKillPrize,
        maxParticipants: tournamentsTable.maxParticipants,
        currentParticipants: tournamentsTable.currentParticipants,
        scheduledAt: tournamentsTable.scheduledAt,
        isEnded: tournamentsTable.isEnded,
        createdAt: tournamentsTable.createdAt,
        updatedAt: tournamentsTable.updatedAt,
      })
      .from(tournamentParticipantsTable)
      .innerJoin(
        tournamentsTable,
        eq(tournamentParticipantsTable.tournamentId, tournamentsTable.id)
      )
      .where(eq(tournamentParticipantsTable.userId, userId))
      .orderBy(tournamentsTable.scheduledAt)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching participated tournaments:", error);
    throw error;
  }
}
