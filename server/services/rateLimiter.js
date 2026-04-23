import Redis from "ioredis";
import { CONFIG } from "../config/constants.js";
import logger from "./logger.js";

let redis = null;
let redisConnected = false;

const memoryRateLimits = new Map();
let cleanupInterval = null;

const startMemoryRateLimitCleanup = () => {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, { windowStart }] of memoryRateLimits) {
      if (now > windowStart + 900000) {
        memoryRateLimits.delete(key);
      }
    }
  }, 60000);
};

const getRedisClient = () => {
  if (redis) return redis;
  
  if (!process.env.REDIS_URL) {
    logger.warn(`[${CONFIG.SERVICE_ID}] Redis not configured - using in-memory rate limiting`);
    return null;
  }
  
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: true,
    connectTimeout: 5000,
    commandTimeout: 3000
  });
  
  redis.on("error", (err) => {
    if (redisConnected) {
      logger.warn(`[${CONFIG.SERVICE_ID}] Redis rate limit error: ${err.message}`);
      redisConnected = false;
    }
  });
  
  redis.on("connect", () => {
    redisConnected = true;
    logger.info(`[${CONFIG.SERVICE_ID}] Redis rate limiter connected`);
  });
  
  redis.on("close", () => {
    redisConnected = false;
  });

  return redis;
};

const checkMemoryRateLimit = (key, windowMs, max) => {
  const now = Date.now();
  const windowStart = memoryRateLimits.get(key)?.windowStart || now;
  
  if (now - windowStart > windowMs) {
    memoryRateLimits.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1 };
  }
  
  const current = memoryRateLimits.get(key);
  const count = (current?.count || 0) + 1;
  const remaining = Math.max(0, max - count);
  
  memoryRateLimits.set(key, { count, windowStart });
  
  return { allowed: count <= max, remaining };
};

const incrementRedisRateLimit = async (key, windowMs, max) => {
  const client = getRedisClient();
  if (!client || !redisConnected) {
    return null;
  }
  
  try {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;
    const clearBefore = now - windowMs;
    
    const results = await Promise.all([
      client.zremrangebyscore(windowKey, 0, clearBefore),
      client.zadd(windowKey, now, `${now}-${Math.random()}`),
      client.zcard(windowKey),
      client.expire(windowKey, Math.ceil(windowMs / 1000))
    ]);
    
    const count = results[2];
    return { allowed: count <= max, remaining: Math.max(0, max - count) };
  } catch (err) {
    logger.warn(`Redis rate limit check failed: ${err.message}`);
    return null;
  }
};

export const rateLimiter = (options = {}) => {
  const {
    windowMs = 60000,
    max = 100,
    keyGenerator = (req) => req.ip,
    message = { error: "Too many requests, please try again later" },
    skip = () => false
  } = options;
  
  return async (req, res, next) => {
    if (skip(req)) {
      return next();
    }
    
    const key = keyGenerator(req);
    
    let result;
    
    if (redisConnected) {
      result = await incrementRedisRateLimit(key, windowMs, max);
    }
    
    if (!result) {
      result = checkMemoryRateLimit(key, windowMs, max);
    }
    
    res.set("X-RateLimit-Limit", max);
    res.set("X-RateLimit-Remaining", result.remaining);
    
    if (!result.allowed) {
      const retryAfter = Math.ceil(windowMs / 1000);
      res.set("Retry-After", retryAfter);
      
      if (req.headers.accept?.includes("application/json") || req.xhr) {
        return res.status(429).json({
          ...message,
          retryAfter: `${retryAfter} seconds`
        });
      }
      
      return res.status(429).send("Too many requests");
    }
    
    next();
  };
};

export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many authentication attempts, please try again later" }
});

export const writeRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many write requests, please slow down" }
});

export const blockchainRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Blockchain rate limit exceeded, please wait" }
});

export const fileUploadRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Too many file uploads, please wait" }
});

export const searchRateLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many search requests" }
});

export const createRateLimiter = (options) => rateLimiter(options);

export const connect = () => {
  startMemoryRateLimitCleanup();
  
  const client = getRedisClient();
  if (client) {
    client.connect().catch(() => {
      logger.warn(`[${CONFIG.SERVICE_ID}] Redis rate limiter using in-memory fallback`);
    });
  }
};

export const getStatus = () => ({
  mode: redisConnected ? "redis" : "memory",
  redisConnected
});

export const getRateLimiterStatus = () => ({
  mode: redisConnected ? "redis" : "memory",
  redisConnected
});

export default {
  rateLimiter,
  authRateLimiter,
  writeRateLimiter,
  blockchainRateLimiter,
  fileUploadRateLimiter,
  searchRateLimiter,
  createRateLimiter,
  connect,
  getStatus
};