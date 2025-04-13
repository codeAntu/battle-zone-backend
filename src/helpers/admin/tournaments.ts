import { and, eq } from "drizzle-orm";
import db from "../../config/db";
import {
  tournamentParticipantsTable,
  tournamentsTable,
  usersTable,
  winningsTable,
  historyTable,
} from "../../drizzle/schema";
import { TournamentType, TournamentUpdateType, TournamentEditType } from "../../zod/tournaments";

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
    const tournamentName = tournament[0].name;

    await db
      .insert(winningsTable)
      .values({
        userId: userId,
        tournamentId: id,
        amount: prizeAmount,
      })
      .execute();

    // Add record to history table
    await db
      .insert(historyTable)
      .values({
        userId: userId,
        transactionType: "tournament_winnings",
        amount: prizeAmount,
        balanceEffect: "increase",
        status: "completed",
        message: `Tournament winnings: ${tournamentName} - Prize: ${prizeAmount}`,
        referenceId: id,
        createdAt: new Date(),
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
      throw new Error(
        `Tournament with ID ${tournamentId} not found for this admin`
      );
    }

    const perKillPrize = tournament[0].perKillPrize;
    const killReward = perKillPrize * kills;
    const tournamentName = tournament[0].name;

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
        type: "kill",
      })
      .execute();

    // Add record to history table
    await db
      .insert(historyTable)
      .values({
        userId: userId,
        transactionType: "kill_reward",
        amount: killReward,
        balanceEffect: "increase",
        status: "completed",
        message: `Kill reward: ${kills} kills in ${tournamentName} - Reward: ${killReward}`,
        referenceId: tournamentId,
        createdAt: new Date(),
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
      success: true,
    };
  } catch (error) {
    console.error("Error awarding kill money:", error);
    throw error;
  }
}

export async function deleteTournament(adminId: number, id: number) {
  try {
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid tournament ID: ${id}`);
    }

    // Check if tournament exists and belongs to the admin
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    if (!tournament || tournament.length === 0) {
      throw new Error(`Tournament with ID ${id} not found for this admin`);
    }

    // Check if tournament has participants
    const participants = await db
      .select()
      .from(tournamentParticipantsTable)
      .where(eq(tournamentParticipantsTable.tournamentId, id))
      .execute();

    if (participants && participants.length > 0) {
      throw new Error(`Cannot delete tournament with ${participants.length} participants`);
    }

    // Delete tournament if no participants
    await db
      .delete(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    return { success: true, message: "Tournament deleted successfully" };
  } catch (error) {
    console.error("Error deleting tournament:", error);
    throw error;
  }
}

export async function editTournament(
  adminId: number,
  id: number,
  data: TournamentEditType
) {
  try {
    if (isNaN(id) || id <= 0) {
      throw new Error(`Invalid tournament ID: ${id}`);
    }

    // Check if tournament exists and belongs to the admin
    const tournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    if (!tournament || tournament.length === 0) {
      throw new Error(`Tournament with ID ${id} not found for this admin`);
    }

    // Check if the tournament has already ended
    if (tournament[0].isEnded) {
      throw new Error(`Cannot edit tournament that has already ended`);
    }

    // Check if participants > new maxParticipants
    if (data.maxParticipants && tournament[0].currentParticipants > data.maxParticipants) {
      throw new Error(`Cannot reduce max participants below current participant count (${tournament[0].currentParticipants})`);
    }

    // Create update object with only the provided fields
    const updateData: any = {};
    if (data.game) updateData.game = data.game;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.roomId) updateData.roomId = String(data.roomId);
    if (data.roomPassword !== undefined) updateData.roomPassword = data.roomPassword;
    if (data.entryFee !== undefined) updateData.entryFee = data.entryFee;
    if (data.prize !== undefined) updateData.prize = data.prize;
    if (data.perKillPrize !== undefined) updateData.perKillPrize = data.perKillPrize;
    if (data.maxParticipants) updateData.maxParticipants = data.maxParticipants;
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);

    // Update tournament
    await db
      .update(tournamentsTable)
      .set(updateData)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    // Get the updated tournament
    const updatedTournament = await db
      .select()
      .from(tournamentsTable)
      .where(
        and(eq(tournamentsTable.adminId, adminId), eq(tournamentsTable.id, id))
      )
      .execute();

    return updatedTournament[0];
  } catch (error) {
    console.error("Error editing tournament:", error);
    throw error;
  }
}
