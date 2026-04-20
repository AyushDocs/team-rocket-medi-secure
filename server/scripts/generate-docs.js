import swaggerJsdoc from "swagger-jsdoc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { CONFIG } from "../config/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MediSecure API",
      version: CONFIG.VERSION,
      description: "Decentralized Healthcare Platform API",
      contact: {
        name: "MediSecure Team",
        email: "support@medisecure.health"
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
        }
      }
    }
  },
  apis: ["./routes/*.js", "./controllers/*.js"]
};

const spec = swaggerJsdoc(options);

const outputPath = path.join(__dirname, "../docs/openapi.json");
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`OpenAPI spec generated: ${outputPath}`);
console.log(`Total endpoints: ${Object.keys(spec.paths).length}`);