export const createResponse = (data, meta = {}) => ({
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId: meta.requestId || null,
    ...meta
  }
});

export const createPaginatedResponse = (data, pagination, meta = {}) => ({
  data,
  pagination: {
    page: pagination.page || 1,
    limit: pagination.limit || 20,
    total: pagination.total || data.length,
    totalPages: Math.ceil((pagination.total || data.length) / (pagination.limit || 20)),
    hasMore: (pagination.page || 1) * (pagination.limit || 20) < (pagination.total || data.length)
  },
  meta: {
    timestamp: new Date().toISOString(),
    requestId: meta.requestId || null,
    ...meta
  }
});

export const createErrorResponse = (code, message, details = null, requestId = null) => ({
  error: {
    code,
    message,
    ...(details && { details }),
    timestamp: new Date().toISOString(),
    requestId
  }
});

export const createSuccessResponse = (message, data = null, meta = {}) => ({
  success: true,
  message,
  ...(data && { data }),
  meta: {
    timestamp: new Date().toISOString(),
    requestId: meta.requestId || null,
    ...meta
  }
});

export const responseWrapper = (req, res, next) => {
  const originalJson = res.json.bind(res);
  
  res.json = (data) => {
    if (data?.error) {
      return originalJson(data);
    }
    
    if (data?.success !== undefined) {
      return originalJson(data);
    }
    
    if (data?.data !== undefined && data?.pagination !== undefined) {
      return originalJson(data);
    }
    
    return originalJson(createResponse(data, { requestId: req.id }));
  };
  
  res.success = (data, meta = {}) => {
    return originalJson(createResponse(data, { requestId: req.id, ...meta }));
  };
  
  res.paginated = (data, pagination, meta = {}) => {
    return originalJson(createPaginatedResponse(data, pagination, { requestId: req.id, ...meta }));
  };
  
  res.error = (code, message, details = null) => {
    return res.status(400).json(createErrorResponse(code, message, details, req.id));
  };
  
  res.created = (data, location = null) => {
    if (location) res.set("Location", location);
    return originalJson(createResponse(data, { requestId: req.id }));
  };
  
  res.noContent = () => {
    return res.status(204).send();
  };
  
  next();
};

export const NOT_FOUND = "NOT_FOUND";
export const VALIDATION_ERROR = "VALIDATION_ERROR";
export const INTERNAL_ERROR = "INTERNAL_ERROR";
export const UNAUTHORIZED = "UNAUTHORIZED";
export const FORBIDDEN = "FORBIDDEN";
export const CONFLICT = "CONFLICT";
export const RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";
export const INVALID_REQUEST = "INVALID_REQUEST";
export const SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";

export default {
  createResponse,
  createPaginatedResponse,
  createErrorResponse,
  createSuccessResponse,
  responseWrapper,
  NOT_FOUND,
  VALIDATION_ERROR,
  INTERNAL_ERROR,
  UNAUTHORIZED,
  FORBIDDEN,
  CONFLICT,
  RATE_LIMIT_EXCEEDED,
  INVALID_REQUEST,
  SERVICE_UNAVAILABLE
};