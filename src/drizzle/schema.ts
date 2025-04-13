import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  datetime,
  int,
  mysqlTable,
  timestamp,
  varchar,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import transaction from "../api/user/transection";

// Users table with constraint
export const usersTable = mysqlTable(
  "users",
  {
    id: int("id").primaryKey().autoincrement(),
    name: varchar({ length: 255 }).notNull().default(""),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    isVerified: boolean().notNull().default(false),
    verificationCode: varchar({ length: 255 }).notNull(),
    verificationCodeExpires: datetime().notNull(),
    balance: int("balance").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [check("balance_non_negative", sql`${table.balance} >= 0`)]
);

// Renamed to avoid collision with existing table
export const adminTable = mysqlTable("admin", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  isVerified: boolean().notNull().default(false),
  verificationCode: varchar({ length: 255 }).notNull(),
  verificationCodeExpires: datetime().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Games table to store game information
export const gamesTable = mysqlTable("games", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar({ length: 100 }).notNull().unique(),
  description: varchar({ length: 500 }),
  icon: varchar({ length: 255 }),
  thumbnail: varchar({ length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Tournaments table with combined datetime
export const tournamentsTable = mysqlTable(
  "tournaments",
  {
    id: int("id").primaryKey().autoincrement(),
    adminId: int("adminId")
      .notNull()
      .references(() => adminTable.id),
    game: varchar({ length: 255 }),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    roomId: varchar({ length: 255 }).default("0"),
    roomPassword: varchar({ length: 255 }),
    entryFee: int("entryFee").notNull(),
    prize: int("prize").notNull(),
    perKillPrize: int("perKillPrize").notNull(),
    maxParticipants: int("maxParticipants").notNull(),
    currentParticipants: int("currentParticipants").notNull().default(0),
    scheduledAt: datetime().notNull(),
    isEnded: boolean().notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [
    check("entry_fee_non_negative", sql`${table.entryFee} >= 0`),
    check("prize_non_negative", sql`${table.prize} >= 0`),
    check("per_kill_prize_non_negative", sql`${table.perKillPrize} >= 0`),
    check(
      "current_participants_non_negative",
      sql`${table.currentParticipants} >= 0`
    ),
    check(
      "current_participants_max",
      sql`${table.currentParticipants} <= ${table.maxParticipants}`
    ),
  ]
);

// Tournament participants table with player information
export const tournamentParticipantsTable = mysqlTable(
  "tournament_participants",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: int("userId")
      .notNull()
      .references(() => usersTable.id),
    tournamentId: int("tournamentId")
      .notNull()
      .references(() => tournamentsTable.id),
    playerUsername: varchar({ length: 255 }).notNull(), // Game username
    playerUserId: varchar({ length: 255 }).notNull(), // Game user ID
    playerLevel: int("playerLevel").notNull(), // Add player level
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  }
);

// Winnings table with corrected reference type
export const winningsTable = mysqlTable("winnings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id),
  tournamentId: int("tournamentId")
    .notNull()
    .references(() => tournamentsTable.id),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["winnings", "kill"]).notNull().default("winnings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const depositTable = mysqlTable("deposit", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id),
  amount: int("amount").notNull(),
  status: varchar({ length: 255 }).notNull(),
  transactionId: int("transactionId").notNull(),
  upiId: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const withdrawTable = mysqlTable("withdraw", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  amount: int("amount").notNull(),
  upiId: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Withdraw history table with corrected reference type
export const historyTable = mysqlTable("history", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id),
  transactionType: mysqlEnum("transactionType", [
    "deposit", 
    "withdrawal", 
    "tournament_entry", 
    "tournament_winnings",
    "kill_reward",
    "balance_adjustment",
    "deposit_rejected",
    "withdrawal_rejected"
  ]).notNull(),
  amount: int("amount").notNull(),
  balanceEffect: mysqlEnum("balanceEffect", ["increase", "decrease", "none"]).notNull().default("none"),
  status: varchar({ length: 255 }).notNull(),
  message: varchar({ length: 255 }).notNull(),
  referenceId: int("referenceId"),  // Can store deposit/withdraw/tournament ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rejectedWithdrawTable = mysqlTable("rejected_withdraw", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id),
  amount: int("amount").notNull(),
  upiId: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 255 }).notNull(),
  reason: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rejectedDepositTable = mysqlTable("rejected_deposit", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId")
    .notNull()
    .references(() => usersTable.id),
  amount: int("amount").notNull(),
  upiId: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 255 }).notNull(),
  reason: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
