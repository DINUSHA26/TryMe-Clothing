import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure new models (websiteService, serviceCategory, serviceSubCategory) exist on cached singleton
const shouldReinstantiate =
  !globalForPrisma.prisma ||
  !(globalForPrisma.prisma as any).websiteService ||
  !(globalForPrisma.prisma as any).serviceCategory ||
  !(globalForPrisma.prisma as any).serviceSubCategory;

export const prisma = shouldReinstantiate
  ? new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    })
  : globalForPrisma.prisma!;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
