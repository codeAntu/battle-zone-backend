import { and, eq } from "drizzle-orm";
import db from "../../config/db";
import {
  tournamentParticipantsTable,
  tournamentsTable,
  usersTable,
  winningsTable,
} from "../../drizzle/schema";
import { TournamentType, TournamentUpdateType } from "../../zod/tournaments";

export async function createTournament(adminId: number, data: TournamentType) {
  try {
    const result = await db
      .insert(tournamentsTable)
      .values({
        adminId: adminId,
        game: data.game,
        name: data.name,
        description: data.description || null,
        roomId: String(data.roomId),
        roomPassword: data.roomPassword || null,
        entryFee: Number(data.entryFee),
        prize: Number(data.prize),
        perKillPrize: Number(data.perKillPrize),
        maxParticipants: Number(data.maxParticipants),
        scheduledAt: new Date(data.scheduledAt),
      })
      .$returningId();

    return result[0].id;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }
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
        roomId: String(data.roomId), // Convert to string instead of number
        roomPassword: data.roomPassword || undefined, // Add roomPassword update
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
      .orderBy(tournamentsTable.scheduledAt)
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
      .orderBy(tournamentsTable.scheduledAt)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournament history:", error);
    throw error;
  }
}

export async function endTournament(
  adminId: number,
  id: number,
  userId: number
) {
  try {
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid tournament ID: ${id}`);
    }

    if (isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(
          eq(tournamentsTable.adminId, adminId),
          eq(tournamentsTable.id, id),
          eq(tournamentsTable.isEnded, false) 
        )
      )
      .execute();

    if (!tournament.length) {
      throw new Error(`Tournament with ID ${id} not found or already ended`);
    }

    const participant = await db
      .select({
        participantId: tournamentParticipantsTable.id,
        user: usersTable,
      })
      .from(tournamentParticipantsTable)
      .innerJoin(
        usersTable,
        eq(tournamentParticipantsTable.userId, usersTable.id)
      )
      .where(
        and(
          eq(tournamentParticipantsTable.tournamentId, id),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .execute();

    if (!participant.length) {
      throw new Error(
        `User with ID ${userId} is not a participant in this tournament`
      );
    }

    const user = participant[0].user;
    const prizeAmount = tournament[0].prize;

    await db
      .insert(winningsTable)
      .values({
        userId: userId,
        tournamentId: id,
        amount: prizeAmount,
      })
      .execute();

    await db
      .update(usersTable)
      .set({
        balance: user.balance + prizeAmount,
      })
      .where(eq(usersTable.id, userId))
      .execute();

    await db
      .update(tournamentsTable)
      .set({
        isEnded: true,
      })
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    const updatedTournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    return updatedTournament[0];
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
      .orderBy(tournamentsTable.scheduledAt)
      .execute();

    return tournaments;
  } catch (error) {
    console.error("Error fetching current tournaments:", error);
    throw error;
  }
}

export async function getTournamentParticipants(adminId: number, id: number) {
  try {
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    if (!tournament.length) {
      throw new Error(`Tournament not found for this admin`);
    }

    const participants = await db
      .select({
        id: tournamentParticipantsTable.id,
        joinedAt: tournamentParticipantsTable.joinedAt,
        name: usersTable.name,
        email: usersTable.email,
        userId: usersTable.id,
        playerUsername: tournamentParticipantsTable.playerUsername,
        playerUserId: tournamentParticipantsTable.playerUserId,
        playerLevel: tournamentParticipantsTable.playerLevel,
      })
      .from(tournamentParticipantsTable)
      .innerJoin(
        usersTable,
        eq(tournamentParticipantsTable.userId, usersTable.id)
      )
      .where(eq(tournamentParticipantsTable.tournamentId, id))
      .execute();

    return participants;
  } catch (error) {
    console.error("Error fetching tournament participants:", error);
    throw error;
  }
}

export async function awardKillMoney(
  adminId: number,
  tournamentId: number,
  userId: number,
  kills: number
) {
  try {
    if (isNaN(tournamentId) || tournamentId <= 0) {
      throw new Error(`Invalid tournament ID: ${tournamentId}`);
    }

    if (isNaN(userId) || userId <= 0) {
      throw new Error(`Invalid user ID: ${userId}`);
    }

    if (isNaN(kills) || kills < 0) {
      throw new Error(`Invalid kill count: ${kills}`);
    }

    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(
          eq(tournamentsTable.adminId, adminId),
          eq(tournamentsTable.id, tournamentId)
        )
      )
      .execute();

    if (!tournament.length) {
      throw new Error(`Tournament with ID ${tournamentId} not found for this admin`);
    }

    const perKillPrize = tournament[0].perKillPrize;
    const killReward = perKillPrize * kills;

    const participant = await db
      .select({
        participantId: tournamentParticipantsTable.id,
        user: usersTable,
      })
      .from(tournamentParticipantsTable)
      .innerJoin(
        usersTable,
        eq(tournamentParticipantsTable.userId, usersTable.id)
      )
      .where(
        and(
          eq(tournamentParticipantsTable.tournamentId, tournamentId),
          eq(tournamentParticipantsTable.userId, userId)
        )
      )
      .execute();

    if (!participant.length) {
      throw new Error(
        `User with ID ${userId} is not a participant in this tournament`
      );
    }

    const user = participant[0].user;

    await db
      .insert(winningsTable)
      .values({
        userId: userId,
        tournamentId: tournamentId,
        amount: killReward,
      })
      .execute();

    await db
      .update(usersTable)
      .set({
        balance: user.balance + killReward,
      })
      .where(eq(usersTable.id, userId))
      .execute();

    return { 
      userId,
      kills,
      killReward,
      success: true
    };
  } catch (error) {
    console.error("Error awarding kill money:", error);
    throw error;
  }
}
