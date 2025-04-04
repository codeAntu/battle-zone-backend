import { z } from "zod";

export const tournamentsValidation = z
  .object({
    game: z.enum(["PUBG", "FREEFIRE"]),
    name: z.string().min(1).max(50),
    description: z.string().max(255).optional(),
    roomId: z
      .string()
      .optional()
      .default("0")
      .refine((val) => !isNaN(Number(val)), {
        message: "Room ID must be a valid numeric string",
      }),
    entryFee: z.number().int().nonnegative(),
    prize: z.number().int().nonnegative(),
    perKillPrize: z.number().int().nonnegative(),
    maxParticipants: z.number().int().positive(),
    scheduledAt: z
      .string()
      .refine((dateTimeStr) => !isNaN(Date.parse(dateTimeStr)), {
        message: "Invalid date/time format",
      }),
  })
  .refine(
    (data) => {
      const now = new Date();
      const tournamentDateTime = new Date(data.scheduledAt);
      return tournamentDateTime > now;
    },
    {
      message: "Tournament date and time must be in the future",
      path: ["scheduledAt"],
    }
  );

export const tournamentUpdateValidation = z.object({
  roomId: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Room ID must be a valid numeric string",
    }),
});

// Infer the type
export type TournamentType = z.infer<typeof tournamentsValidation>;

export type TournamentUpdateType = z.infer<typeof tournamentUpdateValidation>;
