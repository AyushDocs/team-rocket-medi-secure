import express from "express";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const { ipKeyGenerator } = rateLimit;

export const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    const contentType = res.get("Content-Type");
    if (contentType && contentType.includes("image")) return false;
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-origin" }
});

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-API-Version"],
  exposedHeaders: ["X-Request-ID", "X-API-Version", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400
};

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "Too many requests" 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health" || req.path === "/"
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "Too many requests" 
    } 
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  keyGenerator: (req) => req.apiKey || ipKeyGenerator(req),
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "API key rate limit exceeded" 
    } 
  }
});

export const ipfsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "IPFS rate limit exceeded" 
    } 
  }
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "Write operation rate limit exceeded" 
    } 
  }
});

export const blockchainLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { 
    error: { 
      code: "RATE_LIMIT_EXCEEDED", 
      message: "Blockchain operation rate limit exceeded" 
    } 
  }
});

export const payloadValidator = (req, res, next) => {
  const contentLength = parseInt(req.headers["content-length"] || "0", 10);
  const maxPayloadSize = 10 * 1024 * 1024;
  
  if (contentLength > maxPayloadSize) {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Payload too large",
        maxSize: `${maxPayloadSize / 1024 / 1024}MB`
      }
    });
  }
  
  next();
};

export const methodOverride = (req, res, next) => {
  if (req.method === "POST" && req.headers["x-http-method"]) {
    req.method = req.headers["x-http-method"].toUpperCase();
  }
  next();
};

export const requestSizeLimiter = express.json({
  limit: "10mb",
  strict: true,
  type: "application/json"
});

export const queryParser = express.urlencoded({
  extended: true,
  limit: "10mb",
  parameterLimit: 100
});

export default {
  compressionMiddleware,
  helmetMiddleware,
  corsOptions,
  strictRateLimiter,
  apiKeyRateLimiter,
  ipfsLimiter,
  writeLimiter,
  blockchainLimiter,
  payloadValidator,
  methodOverride,
  requestSizeLimiter,
  queryParser
};