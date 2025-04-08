import { sql } from "drizzle-orm";
import {
  datetime,
  int,
  mysqlTable,
  serial,
  timestamp,
  varchar,
  mysqlEnum,
  boolean,
  check,
} from "drizzle-orm/mysql-core";

// Users table with constraint
export const usersTable = mysqlTable(
  "users",
  {
    id: serial().primaryKey(),
    name: varchar({ length: 255 }).default(""),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    isVerified: boolean().notNull().default(false),
    verificationCode: varchar({ length: 255 }).notNull(),
    verificationCodeExpires: datetime().notNull(),
    balance: int().notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (table) => [check("balance_non_negative", sql`${table.balance} >= 0`)]
);

export const adminTable = mysqlTable("admin", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  isVerified: boolean().notNull().default(false),
  verificationCode: varchar({ length: 255 }).notNull(),
  verificationCodeExpires: datetime().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Tournaments table with combined datetime
export const tournamentsTable = mysqlTable(
  "tournaments",
  {
    id: serial().primaryKey(),
    adminId: int()
      .notNull()
      .references(() => adminTable.id),
    game: mysqlEnum("game", ["PUBG", "FREEFIRE"]).notNull(),
    name: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    roomId: varchar({ length: 255 }).default("0"),
    entryFee: int().notNull(),
    prize: int().notNull(),
    perKillPrize: int().notNull(),
    maxParticipants: int().notNull(),
    currentParticipants: int().notNull().default(0),
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

// Tournament participants table
export const tournamentParticipantsTable = mysqlTable(
  "tournament_participants",
  {
    id: serial().primaryKey(),
    userId: int()
      .notNull()
      .references(() => usersTable.id),
    tournamentId: int()
      .notNull()
      .references(() => tournamentsTable.id),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  }
);

// Winnings table
export const winningsTable = mysqlTable("winnings", {
  id: serial().primaryKey(),
  userId: int()
    .notNull()
    .references(() => usersTable.id),
  tournamentId: int()
    .notNull()
    .references(() => tournamentsTable.id),
  amount: int().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Withdraw table
export const withdrawTable = mysqlTable("withdraw", {
  id: serial().primaryKey(),
  userId: int()
    .notNull()
    .references(() => usersTable.id),
  tournamentId: int()
    .notNull()
    .references(() => tournamentsTable.id),
  amount: int().notNull(),
  status: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Deposit table
export const depositTable = mysqlTable("deposit", {
  id: serial().primaryKey(),
  userId: int()
    .notNull()
    .references(() => usersTable.id),
  amount: int().notNull(),
  status: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Admin table (for CRUD operations)

// Withdraw history table (for admin)
export const withdrawHistoryTable = mysqlTable("withdraw_history", {
  id: serial().primaryKey(),
  adminId: int()
    .notNull()
    .references(() => adminTable.id),
  withdrawId: int()
    .notNull()
    .references(() => withdrawTable.id),
  action: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
