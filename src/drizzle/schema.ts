import {
  int,
  mysqlTable,
  serial,
  varchar,
  datetime,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

// Users table
export const usersTable = mysqlTable("users", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const adminTable = mysqlTable("admin", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Tournaments table
export const tournamentsTable = mysqlTable("tournaments", {
  id: serial().primaryKey(),
  game: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  gameId: int().notNull(),
  entryFee: int().notNull(),
  prize: int().notNull(),
  maxParticipants: int().notNull(),
  startDate: datetime().notNull(),
  endDate: datetime().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

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

// History table
export const historyTable = mysqlTable("history", {
  id: serial().primaryKey(),
  userId: int()
    .notNull()
    .references(() => usersTable.id),
  turnamentId: int()
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
