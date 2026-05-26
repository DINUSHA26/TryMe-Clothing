import Redis from "ioredis";

// Create Redis client singleton
const getRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn("REDIS_URL environment variable is not set. Redis features will be disabled.");
    // Return a mock/dummy client or null
    return null;
  }

  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying
        }
        return Math.min(times * 200, 1000); // Exponential backoff
      },
    });

    redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    redis.on("connect", () => {
      console.log("Redis connected successfully");
    });

    return redis;
  } catch (error) {
    console.error("Failed to initialize Redis client:", error);
    return null;
  }
};

// Export singleton instance
export const redis = getRedisClient();

// Helper functions for common operations
export const redisHelpers = {
  /**
   * Set a key with expiration in seconds
   */
  async setWithExpiry(key: string, value: string, expiryInSeconds: number) {
    if (!redis) return null;
    return redis.setex(key, expiryInSeconds, value);
  },

  /**
   * Get a key
   */
  async get(key: string) {
    if (!redis) return null;
    return redis.get(key);
  },

  /**
   * Delete a key
   */
  async delete(key: string) {
    if (!redis) return 0;
    return redis.del(key);
  },

  /**
   * Check if key exists
   */
  async exists(key: string) {
    if (!redis) return 0;
    return redis.exists(key);
  },

  /**
   * Increment a counter with expiration
   */
  async incrementWithExpiry(key: string, expiryInSeconds: number) {
    if (!redis) return 0;
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, expiryInSeconds);
    const results = await pipeline.exec();
    return (results?.[0]?.[1] as number) || 0;
  },

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string) {
    if (!redis) return -2;
    return redis.ttl(key);
  },
};
