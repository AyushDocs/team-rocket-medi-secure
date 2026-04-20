import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const elkFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const createLogMetadata = (requestId = null) => ({
  service: {
    name: CONFIG.SERVICE_NAME,
    id: CONFIG.SERVICE_ID,
    version: CONFIG.VERSION
  },
  requestId
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: elkFormat,
  defaultMeta: createLogMetadata(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, requestId, stack, ...meta }) => {
          const reqId = requestId ? `[${requestId}] ` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          let msg = message;
          if (typeof message === 'object') {
            msg = JSON.stringify(message);
          }
          if (stack) {
            msg = `${msg}\n${stack}`;
          }
          return `${timestamp} ${reqId}${level}: ${msg} ${metaStr}`;
        })
      )
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/api.log'),
      level: 'http',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

export const logRequest = (req, res, duration, requestId = null) => {
  const baseMeta = createLogMetadata(requestId);
  
  logger.http({
    message: 'API Request',
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    statusCode: res.statusCode,
    durationMs: duration,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
    referer: req.get('referer') || '',
    ...baseMeta
  });
};

export const logError = (error, context = {}) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    errorType: error.name || 'Error',
    ...context
  }, createLogMetadata(context.requestId));
};

export const logInfo = (message, meta = {}) => {
  logger.info(message, { ...meta, ...createLogMetadata(meta.requestId) });
};

export const logWarning = (message, meta = {}) => {
  logger.warn(message, { ...meta, ...createLogMetadata(meta.requestId) });
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, { ...meta, ...createLogMetadata(meta.requestId) });
};

export const logSecurityEvent = (eventType, details, requestId = null) => {
  logger.warn({
    message: `Security Event: ${eventType}`,
    eventType,
    security: true,
    timestamp: new Date().toISOString(),
    ...details
  }, createLogMetadata(requestId));
};

export const logPerformance = (operation, duration, metadata = {}) => {
  logger.info({
    message: 'Performance Metric',
    operation,
    durationMs: duration,
    performance: true,
    ...metadata
  }, createLogMetadata(metadata.requestId));
};

export const logBlockchainEvent = (eventType, transactionHash, details, requestId = null) => {
  logger.info({
    message: `Blockchain Event: ${eventType}`,
    eventType,
    blockchain: true,
    transactionHash,
    timestamp: new Date().toISOString(),
    ...details
  }, createLogMetadata(requestId));
};

export const logDatabaseQuery = (query, duration, metadata = {}) => {
  logger.debug({
    message: 'Database Query',
    query: query.substring(0, 200),
    durationMs: duration,
    database: true,
    ...metadata
  }, createLogMetadata(metadata.requestId));
};

export const createChildLogger = (requestId) => {
  return logger.child({ requestId });
};

export default logger;