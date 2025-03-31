import { z } from "zod";

export const tournamentsValidation = z.object({
  game: z.enum(["PUBG", "FREEFIRE"]),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  roomId: z.number().int().optional(),
  entryFee: z.number().int(),
  prize: z.number().int(),
  perKillPrize: z.number().int(),
  maxParticipants: z.number().int(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  time: z.string().refine((time) => !isNaN(Date.parse(time)), {
    message: "Invalid time format",
  }),
});

export const tournamentUpdateValidation = z.object({
  roomId: z.number().int().positive(),
});

// Infer the type
export type TournamentType = z.infer<typeof tournamentsValidation>;

export type TournamentUpdateType = z.infer<typeof tournamentUpdateValidation>;
