import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@/types/prisma-shim";

// Environment variables validation
const JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || "";
const JWT_ACCESS_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || "3d";
const JWT_REFRESH_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || "3d";

// Types
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Token management functions
export const tokenUtils = {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRY,
    } as SignOptions);
  },

  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY,
    } as SignOptions);
  },

  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  },

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET!) as TokenPayload;
    } catch {
      return null;
    }
  },

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
    } catch {
      return null;
    }
  },

  decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch {
      return null;
    }
  },
};

// Helper to extract token from Authorization header
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
