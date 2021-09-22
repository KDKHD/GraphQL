import { PrismaClient } from "@prisma/client";

export const prismaClient = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

/**
 * Log queries
 */
prismaClient.$on("query", async (e) => {
  console.log(`${e.query} ${e.params}`);
  console.log(`Query took: ${e.duration}ms`)
});