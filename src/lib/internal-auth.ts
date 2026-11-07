import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Verifies the shared-secret header the Edge middleware sends to internal-only
 * endpoints (/api/internal/*). The secret is the server's JWT_SECRET.
 */
export function verifyInternalSecret(request: NextRequest): boolean {
  const secret = process.env.JWT_SECRET || "";
  const provided = request.headers.get("x-internal-secret") || "";
  if (!secret || !provided) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

