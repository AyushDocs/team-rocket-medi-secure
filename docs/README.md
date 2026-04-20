# MediSecure API Documentation

## Overview

MediSecure is a decentralized healthcare platform API built on Ethereum blockchain. This documentation covers all API endpoints, authentication, and usage.

## Quick Start

### Running the API

```bash
cd server
npm install
npm run dev
```

### Accessing Documentation

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

## API Endpoints

### Health & Status

| Endpoint | Description |
|----------|-------------|
| `GET /` | API root with service info |
| `GET /health` | Service health status |
| `GET /migrations/status` | Migration status |

### Core Services

| Endpoint | Description |
|----------|-------------|
| `POST /patient/vitals` | Sync patient vitals |
| `GET /patient/resolve/:id` | Resolve patient address |
| `POST /emergency/access` | Trigger emergency access |
| `POST /files` | Upload file to IPFS |
| `GET /files/:hash` | Get file from IPFS |

### Authentication

The API supports multiple authentication methods:

1. **JWT Token** - Via `Authorization` header:
   ```
   Authorization: Bearer <token>
   ```

2. **API Key** - Via `x-api-key` header:
   ```
   x-api-key: <api-key>
   ```

3. **Emergency Token** - For emergency access endpoints

## Rate Limits

| Limit Type | Requests | Window |
|------------|----------|--------|
| General API | 100 | 15 min |
| Write Operations | 20 | 1 min |
| Blockchain Calls | 10 | 1 min |
| File Uploads | 5 | 1 min |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No |
| `RPC_URL` | Ethereum RPC URL | Yes |
| `DATABASE_URL` | Prisma database URL | Yes |
| `JWT` | JWT secret | Yes |
| `PINATA_API_KEY` | IPFS Pinata API key | Yes |
| `PINATA_SECRET_API_KEY` | IPFS Pinata secret | Yes |

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {}
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## SDK Usage

### JavaScript/TypeScript

```javascript
const response = await fetch('http://localhost:5000/patient/vitals', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ patientId: '0x...', systolicBP: 120 })
});
```

### cURL

```bash
curl -X POST http://localhost:5000/patient/vitals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"patientId": "0x...", "systolicBP": 120}'
```

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:
- `/api-docs.json` - JSON format
- `/docs/openapi.json` - Generated file

## Generating Documentation

```bash
# Generate OpenAPI spec
npm run docs:generate

# Serve docs locally
npm run docs:serve
```

## Support

- Email: support@medisecure.health
- GitHub: https://github.com/medisecure/api/issues