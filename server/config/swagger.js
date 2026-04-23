import swaggerJsdoc from "swagger-jsdoc";
import { CONFIG } from "../config/constants.js";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MediSecure API",
      version: CONFIG.VERSION,
      description: `
## Decentralized Healthcare Platform API

MediSecure is a blockchain-based healthcare platform that empowers patients with control over their medical data.

### Features
- **Patient Management**: Register, update, and manage patient records
- **Doctor Verification**: Verify doctor credentials on-chain
- **Emergency Access**: Quick access to patient records in emergencies
- **File Storage**: IPFS-based secure medical file storage
- **Insurance**: Insurance claim management
- **Wellness Tracking**: Sync vitals and health data
- **Messaging**: Real-time patient-doctor communication
- **Family Access**: Manage family member health records
- **Export**: Generate reports and PDFs

### Authentication
- JWT token via \`Authorization\` header
- API Key via \`x-api-key\` header
- Wallet signature verification for blockchain operations

### Rate Limits
- General: 100 requests/15 min
- Write operations: 20/min
- Blockchain calls: 10/min
- File uploads: 5/min

### Base URLs
- Production: \`https://api.medisecure.health\`
- Development: \`http://localhost:5000\`
      `,
      contact: {
        name: "MediSecure Team",
        email: "support@medisecure.health"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: `http://localhost:${CONFIG.PORT}`,
        description: "Local development server"
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        },
        ApiKeyHeader: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
            details: { type: "object" }
          }
        },
        HealthStatus: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["healthy", "degraded"] },
            serviceId: { type: "string" },
            version: { type: "string" },
            blockchain: {
              type: "object",
              properties: {
                healthy: { type: "boolean" },
                network: { type: "string" }
              }
            }
          }
        },
        Patient: {
          type: "object",
          properties: {
            id: { type: "string" },
            walletAddress: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            dateOfBirth: { type: "string", format: "date" },
            bloodType: { type: "string" },
            allergies: { type: "array", items: { type: "string" } }
          }
        },
        Vitals: {
          type: "object",
          properties: {
            patientId: { type: "string" },
            systolicBP: { type: "integer" },
            diastolicBP: { type: "integer" },
            heartRate: { type: "integer" },
            temperature: { type: "number" },
            weight: { type: "number" },
            height: { type: "number" },
            oxygenSat: { type: "integer" },
            timestamp: { type: "string", format: "date-time" }
          }
        },
        Doctor: {
          type: "object",
          properties: {
            id: { type: "string" },
            walletAddress: { type: "string" },
            name: { type: "string" },
            specialization: { type: "string" },
            licenseNumber: { type: "string" },
            verified: { type: "boolean" },
            hospital: { type: "string" }
          }
        },
        Appointment: {
          type: "object",
          properties: {
            id: { type: "string" },
            patientId: { type: "string" },
            doctorId: { type: "string" },
            dateTime: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            type: { type: "string", enum: ["consultation", "followup", "emergency"] },
            status: { type: "string", enum: ["scheduled", "completed", "cancelled"] }
          }
        },
        FileUpload: {
          type: "object",
          properties: {
            cid: { type: "string" },
            filename: { type: "string" },
            mimetype: { type: "string" },
            size: { type: "integer" },
            uploadedAt: { type: "string", format: "date-time" }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] },
      { ApiKeyHeader: [] }
    ],
    tags: [
      { name: "Health", description: "Service health and status endpoints" },
      { name: "Patient", description: "Patient management and records" },
      { name: "Doctor", description: "Doctor verification and management" },
      { name: "Emergency", description: "Emergency access to records" },
      { name: "Files", description: "IPFS file storage operations" },
      { name: "Insurance", description: "Insurance and claims management" },
      { name: "Wellness", description: "Vitals and health tracking" },
      { name: "Messaging", description: "Real-time messaging" },
      { name: "Database", description: "Database operations and sync" },
      { name: "Migrations", description: "Database migrations" }
    ]
  },
  apis: ["./routes/*.js", "./controllers/*.js"]
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerOptions = {
  swaggerUiOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "list",
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5rem }
    .swagger-ui .info .description { font-size: 1rem; line-height: 1.5 }
  `,
  customSiteTitle: "MediSecure API Documentation"
};

export default swaggerSpec;