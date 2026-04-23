import { v4 as uuidv4 } from "uuid";
import logger, { logRequest as logReq, logError as logErr } from "../services/logger.js";

export const requestIdMiddleware = (req, res, next) => {
  const id = req.headers["x-request-id"] || uuidv4();
  req.id = id;
  res.setHeader("x-request-id", id);
  res.setHeader("X-Request-ID", id);
  
  req.log = logger.child({ requestId: id });
  req.log.info = (message, meta = {}) => logger.info(message, { requestId: id, ...meta });
  req.log.warn = (message, meta = {}) => logger.warn(message, { requestId: id, ...meta });
  req.log.error = (message, meta = {}) => logger.error(message, { requestId: id, ...meta });
  req.log.debug = (message, meta = {}) => logger.debug(message, { requestId: id, ...meta });

  next();
};

export const requestLoggerMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logReq(req, res, duration, req.id);
    
    if (duration > 2000) {
      logger.warn({
        message: 'Slow request detected',
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        durationMs: duration,
        threshold: 2000
      });
    }
  });
  
  next();
};

export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || "unknown";
  
  logErr(err, {
    requestId,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body ? '[BODY]' : undefined
  });

  if (err.name === "ZodError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        requestId,
        details: err.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      }
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        requestId,
        details: err.details
      }
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_ENTRY",
        message: "Duplicate entry",
        requestId,
        field: err.meta?.target?.[0]
      }
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Record not found",
        requestId
      }
    });
  }

  if (err.name === "JsonWebTokenError" || err.message?.includes("Invalid token")) {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid token",
        requestId
      }
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
        requestId
      }
    });
  }

  if (err.status === 429 || err.message?.includes("rate limit")) {
    return res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: err.message || "Rate limit exceeded",
        requestId,
        retryAfter: err.retryAfter || 60
      }
    });
  }

  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  
  res.status(status).json({
    error: {
      code: status === 500 ? "INTERNAL_ERROR" : "ERROR",
      message: isProduction && status === 500 ? "Internal server error" : err.message,
      requestId
    }
  });
};

export default {
  requestIdMiddleware,
  requestLoggerMiddleware,
  errorHandler
};