import { Hono } from "hono";

const game = new Hono().basePath("/game");

game.get("/list", async (c) => {
  try {
    const games = [
      {
        id: 1,
        name: "PUBG",
        description: "PlayerUnknown's Battlegrounds",
        image:
          "https://www.financialexpress.com/wp-content/uploads/2025/03/PUBG-MOBILE1.jpg",
        iconUrl:
          "https://www.financialexpress.com/wp-content/uploads/2025/03/PUBG-MOBILE1.jpg",
      },
      {
        id: 2,
        name: "FREEFIRE",
        description: "Garena Free Fire",
        iconUrl:
          "https://www.financialexpress.com/wp-content/uploads/2025/03/PUBG-MOBILE1.jpg",
        image:
          "https://www.financialexpress.com/wp-content/uploads/2025/03/PUBG-MOBILE1.jpg",
      },
    ];
    return c.json({
      message: "Games retrieved successfully",
      data: games,
    });
  } catch (error: unknown) {
    console.error("Error retrieving games:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to retrieve games";
    return c.json({ error: errorMessage }, 500);
  }
});

export default game;
