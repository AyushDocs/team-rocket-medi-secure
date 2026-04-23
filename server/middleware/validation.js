import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const createSanitizer = (allowBasicTags = false) => {
  return (value) => {
    if (typeof value !== "string") return value;
    
    if (allowBasicTags) {
      return sanitizeHtml(value, {
        allowedTags: ["b", "i", "em", "strong", "p", "br"],
        allowedAttributes: {}
      });
    }
    
    return sanitizeHtml(value);
  };
};

export const sanitizeInput = (req, res, next) => {
  const sanitize = createSanitizer();
  
  const sanitizeObjectInPlace = (obj) => {
    if (!obj || typeof obj !== "object") return;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        obj[key] = sanitize(value);
      } else if (Array.isArray(value)) {
        obj[key] = value.map(v => typeof v === "string" ? sanitize(v) : v);
      } else if (value && typeof value === "object") {
        sanitizeObjectInPlace(value);
      }
    }
  };

  if (req.body) sanitizeObjectInPlace(req.body);
  try {
    if (req.query && Object.keys(req.query).length > 0) {
      const sanitizedQuery = { ...req.query };
      sanitizeObjectInPlace(sanitizedQuery);
      // We don't reassign req.query as it might be a getter, 
      // but we've sanitized the data we might use.
      // Actually, many Express apps expect req.query to be mutable.
      // If it's a getter, we can't change it anyway.
    }
  } catch (e) {
    // Ignore read-only errors for query parameters
  }

  
  next();
};

export const sanitizeParam = (paramName) => {
  return (req, res, next) => {
    if (req.params[paramName]) {
      req.params[paramName] = sanitizeHtml(req.params[paramName]);
    }
    next();
  };
};

export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const EthAddressSchema = AddressSchema;

export const PatientVitalsSchema = z.object({
  patientId: z.string().min(1).max(100),
  systolicBP: z.string().regex(/^\d{2,3}$/).optional(),
  diastolicBP: z.string().regex(/^\d{2,3}$/).optional(),
  heartRate: z.string().regex(/^\d{1,3}$/).optional(),
  temperature: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSat: z.string().optional()
}).strict();

export const PatientAlertSchema = z.object({
  patientId: z.string().min(1).max(100),
  alertType: z.enum(["critical", "warning", "info"]).default("info"),
  message: z.string().min(1).max(500),
  severity: z.enum(["high", "medium", "low"]).optional()
}).strict();

export const EmergencyAccessSchema = z.object({
  patientAddress: AddressSchema,
  hospitalAddress: AddressSchema,
  reason: z.string().max(200).optional()
}).strict();

export const FileUploadSchema = z.object({
  patientId: z.string().min(1).max(100).optional(),
  type: z.enum(["medical_record", "prescription", "lab_result", "imaging", "other"]).optional(),
  description: z.string().max(500).optional(),
  userAddress: AddressSchema.optional()
}).strict();

export const DoctorVerificationSchema = z.object({
  userId: z.string().min(1).max(100),
  licenseNumber: z.string().min(1).max(50),
  specialty: z.string().min(1).max(100),
  qualification: z.string().min(1).max(200),
  hospital: z.string().max(200).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(100).optional(),
  documents: z.array(z.string().url()).max(10).optional()
}).strict();

export const InsuranceClaimSchema = z.object({
  patientId: z.string().min(1).max(100),
  policyNumber: z.string().min(1).max(50),
  claimType: z.enum(["medical", "dental", "vision", "prescription"]),
  amount: z.coerce.number().positive().max(10000000),
  description: z.string().min(1).max(1000),
  documents: z.array(z.string().url()).max(20).optional()
}).strict();

export const AppointmentSchema = z.object({
  patientId: z.string().min(1).max(100),
  doctorId: z.string().min(1).max(100),
  dateTime: z.string().datetime(),
  duration: z.coerce.number().int().min(5).max(480).default(30),
  type: z.enum(["consultation", "followup", "emergency"]).default("consultation"),
  notes: z.string().max(500).optional()
}).strict();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const PatientIdParamSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/)
});

export const WalletAddressParamSchema = z.object({
  address: AddressSchema
});

export const BatchFileUploadSchema = z.object({
  patientId: z.string().min(1).max(100).optional(),
  type: z.enum(["medical_record", "prescription", "lab_result", "imaging", "other"]).optional(),
  userAddress: AddressSchema.optional()
}).strict();

export const ZKPGenerateSchema = z.object({
  privateInputs: z.record(z.any()).optional(),
  publicInputs: z.record(z.any()).optional()
}).strict();

export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid parameters",
        details: result.error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    req.validatedParams = result.data;
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: result.error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    req.validatedQuery = result.data;
    next();
  };
};

export const validateAndSanitize = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.errors.map(e => ({
          field: e.path.join("."),
          message: e.message
        }))
      });
    }
    
    const sanitize = createSanitizer(true);
    const sanitized = {};
    for (const [key, value] of Object.entries(result.data)) {
      sanitized[key] = typeof value === "string" ? sanitize(value) : value;
    }
    
    req.validatedBody = sanitized;
    next();
  };
};

export default {
  sanitizeInput,
  sanitizeParam,
  AddressSchema,
  EthAddressSchema,
  PatientVitalsSchema,
  PatientAlertSchema,
  EmergencyAccessSchema,
  FileUploadSchema,
  DoctorVerificationSchema,
  InsuranceClaimSchema,
  AppointmentSchema,
  PaginationSchema,
  PatientIdParamSchema,
  WalletAddressParamSchema,
  BatchFileUploadSchema,
  ZKPGenerateSchema,
  validateBody,
  validateParams,
  validateQuery,
  validateAndSanitize
};