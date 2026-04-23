import logger, { logSecurityEvent as logSec, logPerformance as logPerf } from '../services/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.id;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    logger.http({
      requestId,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });
    
    if (duration > 1000) {
      logger.warn({
        requestId,
        message: 'Slow request',
        method: req.method,
        url: req.originalUrl,
        durationMs: duration,
        threshold: 1000
      });
    }
  });
  
  next();
};

export const errorLogger = (err, req, res, next) => {
  const requestId = req.id || "unknown";
  
  logger.error({
    requestId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body ? '[FILTERED]' : undefined
  });
  
  next(err);
};

export const securityLogger = (req, res, next) => {
  const requestId = req.id;
  const suspiciousPatterns = [
    { pattern: /\.\./g, name: "path_traversal" },
    { pattern: /<script|javascript:|on\w+=/gi, name: "xss_attempt" },
    { pattern: /(union|select|insert|update|delete|drop|create)\s/gi, name: "sql_injection" },
    { pattern: /\{\{/g, name: "template_injection" },
    { pattern: /\$__/g, name: "nosql_injection" }
  ];
  
  const url = req.url;
  const body = req.body ? JSON.stringify(req.body).substring(0, 500) : "";
  
  for (const { pattern, name } of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      logSec(name, {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("user-agent"),
        pattern: name
      });
      break;
    }
  }
  
  next();
};

export const performanceLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const requestId = req.id;
  
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    
    logPerf(`${req.method} ${req.path}`, durationMs, {
      requestId,
      statusCode: res.statusCode
    });
  });
  
  next();
};

export const transactionLogger = (transactionType) => {
  return (req, res, next) => {
    const start = Date.now();
    const requestId = req.id;
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      
      logger.info({
        requestId,
        transaction: transactionType,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        userId: req.user?.id || "anonymous"
      });
    });
    
    next();
  };
};

export { logger };