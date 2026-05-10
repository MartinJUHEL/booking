import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makePrisma() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaLibSql({
    url: `file:${dbPath}`,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
