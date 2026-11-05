import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure new models exist on cached singleton
const shouldReinstantiate =
  !globalForPrisma.prisma ||
  !(globalForPrisma.prisma as any).websiteService ||
  !(globalForPrisma.prisma as any).serviceCategory ||
  !(globalForPrisma.prisma as any).serviceSubCategory ||
  !(globalForPrisma.prisma as any).serviceInquiry;

export const prisma = shouldReinstantiate
  ? new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    })
  : globalForPrisma.prisma!;

// Always cache the singleton across serverless invocations
globalForPrisma.prisma = prisma;

export default prisma;
