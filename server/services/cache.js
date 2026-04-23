import Redis from "ioredis";
import { CONFIG } from "../config/constants.js";
import logger from "./logger.js";

let redis = null;
let redisConnected = false;

const memoryCache = new Map();
let cleanupInterval = null;

const startMemoryCacheCleanup = () => {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, { expiry }] of memoryCache) {
      if (expiry && now > expiry) {
        memoryCache.delete(key);
      }
    }
  }, 60000);
};

const getRedisClient = () => {
  if (redis) return redis;
  
  if (!process.env.REDIS_URL) {
    logger.warn(`[${CONFIG.SERVICE_ID}] REDIS_URL not set - using in-memory cache`);
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
      logger.error(`[${CONFIG.SERVICE_ID}] Redis error: ${err.message}`);
      redisConnected = false;
    }
  });
  
  redis.on("connect", () => {
    logger.info(`[${CONFIG.SERVICE_ID}] Redis connected`);
    redisConnected = true;
  });
  
  redis.on("close", () => {
    redisConnected = false;
    logger.warn(`[${CONFIG.SERVICE_ID}] Redis connection closed - using in-memory cache`);
  });

  redis.on("reconnecting", () => {
    logger.info(`[${CONFIG.SERVICE_ID}] Redis reconnecting...`);
  });
  
  return redis;
};

export const cache = {
  async get(key) {
    try {
      const client = getRedisClient();
      if (client && redisConnected) {
        const data = await client.get(key);
        if (data) {
          return JSON.parse(data);
        }
      }
    } catch (err) {
      logger.warn(`Redis get failed, using memory: ${err.message}`);
    }
    
    const memData = memoryCache.get(key);
    if (memData) {
      if (memData.expiry && Date.now() > memData.expiry) {
        memoryCache.delete(key);
        return null;
      }
      return memData.value;
    }
    return null;
  },

  async set(key, value, ttlSeconds = 300) {
    const serialized = JSON.stringify(value);
    
    try {
      const client = getRedisClient();
      if (client && redisConnected) {
        await client.setex(key, ttlSeconds, serialized);
        return true;
      }
    } catch (err) {
      logger.warn(`Redis set failed, using memory: ${err.message}`);
    }
    
    memoryCache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    });
    return true;
  },

  async del(key) {
    try {
      const client = getRedisClient();
      if (client && redisConnected) {
        await client.del(key);
      }
    } catch (err) {
      logger.warn(`Redis delete failed: ${err.message}`);
    }
    
    memoryCache.delete(key);
    return true;
  },

  async invalidatePattern(pattern) {
    const regex = new RegExp(pattern.replace("*", ".*"));
    
    try {
      const client = getRedisClient();
      if (client && redisConnected) {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      }
    } catch (err) {
      logger.warn(`Redis invalidate failed: ${err.message}`);
    }
    
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
    return true;
  },

  async connect() {
    startMemoryCacheCleanup();
    
    const client = getRedisClient();
    if (client) {
      try {
        await client.connect();
        redisConnected = true;
      } catch (err) {
        logger.warn(`Redis connect failed, using in-memory cache: ${err.message}`);
        redisConnected = false;
      }
    }
  },

  getStatus() {
    return {
      mode: redisConnected ? "redis" : "memory",
      memoryCacheSize: memoryCache.size,
      redisConnected
    };
  },

  clearMemoryCache() {
    memoryCache.clear();
    logger.info(`[${CONFIG.SERVICE_ID}] In-memory cache cleared`);
  }
};

export const cacheMiddleware = (ttlSeconds = 60, keyGenerator) => {
  return async (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
    
    if (req.method !== "GET") {
      return next();
    }

    const cached = await cache.get(key);
    if (cached) {
      res.set("x-cache-hit", "true");
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, ttlSeconds);
      return originalJson(data);
    };

    next();
  };
};

export const invalidateCache = async (pattern) => {
  return cache.invalidatePattern(pattern);
};

export default cache;