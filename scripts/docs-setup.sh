#!/bin/bash

echo "========================================"
echo "  MediSecure API Documentation Setup"
echo "========================================"
echo ""

# Check if server dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

# Generate OpenAPI spec
echo "Generating OpenAPI specification..."
node -e "
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';
import { CONFIG } from './server/config/constants.js';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MediSecure API',
      version: CONFIG.VERSION,
      description: 'Decentralized Healthcare Platform API'
    },
    servers: [{ url: \`http://localhost:\${CONFIG.PORT}\` }]
  },
  apis: ['./server/routes/*.js']
};

const spec = swaggerJsdoc(options);
fs.writeFileSync('./docs/openapi.json', JSON.stringify(spec, null, 2));
console.log('OpenAPI spec saved to docs/openapi.json');
"

echo ""
echo "========================================"
echo "  Documentation Setup Complete"
echo "========================================"
echo ""
echo "Available documentation:"
echo "  - Swagger UI: http://localhost:5000/api-docs"
echo "  - OpenAPI Spec: http://localhost:5000/api-docs.json"
echo "  - JSON Spec: ./docs/openapi.json"
echo ""
echo "To generate PDF documentation, run:"
echo "  npx @redocly/cli build-docs ./docs/openapi.json -o ./docs/index.html"
echo ""