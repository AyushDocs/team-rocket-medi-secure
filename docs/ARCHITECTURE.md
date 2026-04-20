# MediSecure Architecture

## System Overview

```mermaid

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MediSecure Platform                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │    Frontend      │
                              │   (Next.js)      │
                              │    :3000         │
                              └────────┬─────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Load Balancer / Reverse Proxy                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
         ┌───────────────────┐                 ┌───────────────────┐
         │   Backend API      │                 │   Static Files   │
         │   (Express)        │                 │   (Next.js)       │
         │   :5000            │                 │                   │
         └─────────┬─────────┘                 └───────────────────┘
                   │
     ┌─────────────┼─────────────┬───────────────┐
     ▼             ▼             ▼               ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│  Redis  │  │ Postgres │  │   IPFS   │  │ Ethereum │
│ Cache   │  │   DB    │  │  Storage │  │   (L1)   │
└─────────┘  └─────────┘  └──────────┘  └──────────┘
```

## Component Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        F[Frontend<br/>Next.js<br/>React]
        M[Mobile App]
    end

    subgraph "API Gateway"
        H[Helmet<br/>Security]
        C[CORS]
        RL[Rate Limiter]
        RI[Request ID]
    end

    subgraph "Application Layer"
        API[Express API<br/>/api/v1/*]
        S[Swagger UI]
    end

    subgraph "Business Logic"
        P[Patient Service]
        D[Doctor Service]
        E[Emergency Service]
        I[Insurance Service]
        FH[File Handler]
    end

    subgraph "Data Layer"
        DB[(Prisma<br/>PostgreSQL)]
        RED[(Redis Cache)]
    end

    subgraph "External Services"
        ETH[Ethereum<br/>Smart Contracts]
        IPFS[IPFS<br/>File Storage]
        FCM[Firebase<br/>Real-time]
    end

    F --> H
    M --> H
    H --> C
    C --> RL
    RL --> RI
    RI --> API
    API --> S
    
    API --> P
    API --> D
    API --> E
    API --> I
    API --> FH
    
    P --> DB
    D --> DB
    E --> DB
    I --> DB
    FH --> DB
    
    P --> RED
    D --> RED
    
    P --> ETH
    D --> ETH
    E --> ETH
    I --> ETH
    
    FH --> IPFS
    FH --> IPFS
    
    E --> FCM
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as Backend API
    participant BC as Blockchain
    participant IPFS as IPFS
    participant DB as Database

    U->>F: Connect Wallet
    F->>BC: Verify Wallet
    BC-->>F: Wallet Verified
    F-->>U: Show Dashboard

    U->>F: Upload Medical Record
    F->>F: Encrypt Data
    F->>IPFS: Upload to IPFS
    IPFS-->>F: Return CID
    F->>API: Save Record Metadata
    API->>DB: Store metadata
    API-->>F: Record saved

    U->>F: Request Access
    F->>API: POST /patient/access
    API->>BC: Verify Permission
    BC-->>API: Access Granted
    API-->>F: Access Approved

    U->>F: View Records
    F->>API: GET /patient/records
    API->>DB: Query Records
    DB-->>API: Return Records
    API-->>F: Display Records
```

## Service Architecture

```mermaid
graph LR
    subgraph "Core Services"
        P[Patient<br/>Service]
        D[Doctor<br/>Service]
        H[Hospital<br/>Service]
        I[Insurance<br/>Service]
    end

    subgraph "Support Services"
        Auth[Auth<br/>Service]
        Cache[Caching<br/>Service]
        Notif[Notification<br/>Service]
    end

    subgraph "Infrastructure"
        LB[Load<br/>Balancer]
        Mon[Monitoring<br/>Sentry]
        Log[Logging<br/>Winston]
    end

    LB --> P
    LB --> D
    LB --> H
    LB --> I
    
    P --> Auth
    D --> Auth
    H --> Auth
    I --> Auth
    
    P --> Cache
    D --> Cache
    
    P --> Notif
    D --> Notif
    
    P --> Mon
    D --> Mon
    
    P --> Log
    D --> Log
    H --> Log
    I --> Log
```

## Technology Stack

| Layer | Technology | Purpose |
| ------- | ------------ | --------- |
| Frontend | Next.js 14, React 18 | Web UI |
| Styling | Tailwind CSS | Styling |
| State | React Context | State management |
| Backend | Express 5 | REST API |
| Database | PostgreSQL + Prisma | ORM |
| Cache | Redis | Caching |
| Blockchain | Ethereum + Web3 | Smart contracts |
| Storage | IPFS + Pinata | File storage |
| Auth | JWT + Wallet | Authentication |
| Monitoring | Sentry | Error tracking |
| Logging | Winston | Structured logging |
| Docs | Swagger | API documentation |

## Security Architecture

```mermaid
┌─────────────────────────────────────────────────────────┐
│                    Security Architecture                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Network & API Security                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  • HTTPS/TLS & CORS Whitelisting                │  │
│  │  • Rate Limiting & Helmet.js Headers            │  │
│  │  • Zod Input Validation & Request Tracing       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Layer 2: On-Chain Hardening (Sanjeevni Protocol)      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  • Centralized MediSecureAccessControl Registry  │  │
│  │  • Type-Safe Roles (Enum-based RBAC)            │  │
│  │  • 48-Hour Governance Timelock Controller       │  │
│  │  • Chainlink Decentralized Price Oracles        │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Layer 3: Privacy & Data Integrity                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │  • ZK-Proofs for Privacy-Preserving Insurance   │  │
│  │  • Client-Side Peer-to-Peer Encryption          │  │
│  │  • UUPS Upgradeable Proxies with Multi-Sig      │  │
│  │  • Immutable Clinical Audit Trails (Handoffs)   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Kubernetes Cluster"
            LB[Load Balancer]
            
            subgraph "Frontend Namespace"
                FE[Frontend Pods]
            end
            
            subgraph "Backend Namespace"
                BE[Backend Pods]
            end
            
            subgraph "Database Namespace"
                PG[(PostgreSQL)]
                RD[(Redis)]
            end
            
            subgraph "Infrastructure"
                IPFS[IPFS Cluster]
                ETH[Blockchain Node]
            end
        end
        
        CI[GitHub Actions<br/>CI/CD]
    end
    
    CI -->|Deploy| LB
    LB --> FE
    LB --> BE
    BE --> PG
    BE --> RD
    BE --> IPFS
    BE --> ETH
```

## API Endpoints Summary

| Method | Endpoint | Description |
| -------- | ---------- | ------------- |
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger UI |
| POST | `/api/v1/patient/vitals` | Sync vitals |
| POST | `/api/v1/emergency/access` | Emergency access |
| POST | `/api/v1/files` | Upload file |
| POST | `/api/v1/doctor-verification/verify` | Verify doctor |
| POST | `/api/v1/insurance/claim` | Submit claim |
| GET | `/api/v1/messaging` | Get messages |

## Database Schema (Simplified)

```mermaid
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Patient   │     │   Doctor    │     │  Hospital    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id          │     │ id          │     │ id           │
│ walletAddr  │     │ walletAddr  │     │ walletAddr   │
│ name        │     │ name        │     │ name         │
│ email       │     │ specialty   │     │ address      │
│ encryptedData│    │ verified    │     │ verified     │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                   │                   │
       └─────────┬─────────┴───────────────────┘
                 ▼
       ┌──────────────────┐
       │    Record        │
       ├──────────────────┤
       │ id               │
       │ patientId        │
       │ doctorId         │
       │ ipfsCid          │
       │ accessList       │
       │ createdAt        │
       └──────────────────┘
```
