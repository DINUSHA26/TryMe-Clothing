import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const info: Record<string, any> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlHost: process.env.DATABASE_URL ? process.env.DATABASE_URL.split("@")[1]?.split("/")[0] : null,
    hasDirectUrl: !!process.env.DIRECT_URL,
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    info.prismaStatus = "CONNECTED";
    info.categoryCount = categoryCount;
    info.productCount = productCount;
  } catch (err: any) {
    info.prismaStatus = "ERROR";
    info.errorName = err?.name;
    info.errorMessage = err?.message;
    info.errorStack = err?.stack;
  }

  return NextResponse.json(info);
}
