import { redis, redisHelpers } from "./redis";
import { prisma } from "./prisma";

// Configuration from environment
const OTP_EXPIRY_MINUTES = parseInt(
  process.env.OTP_EXPIRY_MINUTES || "5",
  10
);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || "3", 10);
const OTP_RATE_LIMIT_WINDOW = 60; // 1 minute
const OTP_RATE_LIMIT_MAX = 3; // 3 OTPs per minute

export type OTPPurpose = "login" | "verify";

interface OTPData {
  code: string;
  attempts: number;
  expiresAt: number;
}

// Redis key patterns
const otpKey = (identifier: string, purpose: OTPPurpose) =>
  `otp:${purpose}:${identifier}`;
const rateLimitKey = (identifier: string) => `otp:ratelimit:${identifier}`;

export const otpUtils = {
  /**
   * Generate a 6-digit OTP code
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Check rate limit for OTP generation
   */
  async checkRateLimit(identifier: string): Promise<boolean> {
    const key = rateLimitKey(identifier);
    const count = await redisHelpers.incrementWithExpiry(
      key,
      OTP_RATE_LIMIT_WINDOW
    );
    return count <= OTP_RATE_LIMIT_MAX;
  },

  /**
   * Store OTP in Redis
   */
  async store(
    identifier: string,
    code: string,
    purpose: OTPPurpose
  ): Promise<void> {
    const key = otpKey(identifier, purpose);
    const expiryInSeconds = OTP_EXPIRY_MINUTES * 60;
    const expiresAt = Date.now() + expiryInSeconds * 1000;

    const otpData: OTPData = {
      code,
      attempts: 0,
      expiresAt,
    };

    await redisHelpers.setWithExpiry(
      key,
      JSON.stringify(otpData),
      expiryInSeconds
    );

    // Also store in database for audit trail
    await prisma.oTP.create({
      data: {
        identifier,
        code,
        type: "email", // For now, only email
        purpose,
        expiresAt: new Date(expiresAt),
      },
    });
  },

  /**
   * Verify OTP code
   */
  async verify(
    identifier: string,
    code: string,
    purpose: OTPPurpose
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    const key = otpKey(identifier, purpose);
    const data = await redisHelpers.get(key);

    if (!data) {
      return {
        success: false,
        message: "OTP not found or expired",
      };
    }

    const otpData: OTPData = JSON.parse(data);

    // Check if expired
    if (Date.now() > otpData.expiresAt) {
      await redisHelpers.delete(key);
      return {
        success: false,
        message: "OTP has expired",
      };
    }

    // Check attempts
    if (otpData.attempts >= OTP_MAX_ATTEMPTS) {
      await redisHelpers.delete(key);
      return {
        success: false,
        message: "Maximum verification attempts exceeded",
      };
    }

    // Verify code
    if (otpData.code !== code) {
      // Increment attempts
      otpData.attempts++;
      const ttl = await redisHelpers.ttl(key);
      await redisHelpers.setWithExpiry(key, JSON.stringify(otpData), ttl);

      return {
        success: false,
        message: `Invalid OTP. ${OTP_MAX_ATTEMPTS - otpData.attempts} attempts remaining`,
      };
    }

    // Success - delete OTP and mark as used in database
    await redisHelpers.delete(key);
    await prisma.oTP.updateMany({
      where: {
        identifier,
        code,
        purpose,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    return {
      success: true,
    };
  },

  /**
   * Delete OTP (useful for cancellation)
   */
  async delete(identifier: string, purpose: OTPPurpose): Promise<void> {
    const key = otpKey(identifier, purpose);
    await redisHelpers.delete(key);
  },

  /**
   * Get remaining time for OTP in seconds
   */
  async getRemainingTime(
    identifier: string,
    purpose: OTPPurpose
  ): Promise<number | null> {
    const key = otpKey(identifier, purpose);
    const ttl = await redisHelpers.ttl(key);
    return ttl > 0 ? ttl : null;
  },

  /**
   * Check if OTP exists
   */
  async exists(identifier: string, purpose: OTPPurpose): Promise<boolean> {
    const key = otpKey(identifier, purpose);
    const exists = await redisHelpers.exists(key);
    return exists === 1;
  },
};
