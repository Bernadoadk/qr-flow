import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (!global.__db) {
  // Configuration optimisée pour Vercel
  const databaseUrl = process.env.DATABASE_URL;
  
  // Ajouter des paramètres de pool si pas déjà présents
  const optimizedUrl = databaseUrl?.includes('?') 
    ? `${databaseUrl}&connection_limit=1&pool_timeout=20&connect_timeout=60`
    : `${databaseUrl}?connection_limit=1&pool_timeout=20&connect_timeout=60`;

  global.__db = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: optimizedUrl,
      },
    },
  });
}

prisma = global.__db;

export { prisma };
