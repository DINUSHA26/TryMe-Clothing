import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const envStatus: Record<string, any> = {
      ok: true,
      time: new Date().toISOString(),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasDirectUrl: Boolean(process.env.DIRECT_URL),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
    };

    try {
      const { prisma } = await import("@/lib/prisma");
      const catCount = await prisma.category.count();
      envStatus.prisma = "SUCCESS";
      envStatus.categoryCount = catCount;
    } catch (prismaErr: any) {
      envStatus.prisma = "FAILED";
      envStatus.prismaError = String(prismaErr?.message || prismaErr);
      envStatus.prismaCode = prismaErr?.code;
      envStatus.prismaStack = String(prismaErr?.stack || "");
    }

    return NextResponse.json(envStatus);
  } catch (outerErr: any) {
    return NextResponse.json(
      { ok: false, error: String(outerErr?.message || outerErr) },
      { status: 200 } // return 200 so we can read the JSON!
    );
  }
}
