import { PrismaClient } from "@prisma/client";
export * as Models from "@prisma/client";

const prisma = new PrismaClient();

export { prisma };
