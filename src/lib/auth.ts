import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

// Environment variables validation
const JWT_SECRET: string = process.env.JWT_SECRET || "";
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || "";
const JWT_ACCESS_EXPIRY: string = process.env.JWT_ACCESS_EXPIRY || "7d";
const JWT_REFRESH_EXPIRY: string = process.env.JWT_REFRESH_EXPIRY || "7d";

// JWT secrets should be configured in environment variables.
// If missing, verification and generation will fail at runtime.

// Types
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Password hashing functions
export const passwordUtils = {
  /**
   * Hash a password using bcrypt (cost factor 12)
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  /**
   * Compare a plain password with a hashed password
   */
  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * Generate a random password
   */
  generateRandom(length: number = 12): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const all = uppercase + lowercase + numbers + symbols;

    let password = "";
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  },
};

// JWT token functions
export const tokenUtils = {
  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRY,
    } as SignOptions);
  },

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY,
    } as SignOptions);
  },

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload: TokenPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  },

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return null;
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
    } catch (error) {
      return null;
    }
  },

  /**
   * Decode token without verification (useful for reading expired tokens)
   */
  decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
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

// Helper to get token from request headers
export function getTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get("Authorization");
  return extractBearerToken(authHeader);
}
