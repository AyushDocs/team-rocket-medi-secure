# Logging Integration Setup

## Sentry (Error Tracking)

### Quick Start
1. Go to [sentry.io](https://sentry.io) → free account
2. Create Next.js project → copy DSN
3. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

### Files
- `components/SentryProvider.jsx` - Auto-initializes
- `lib/sentry.js` - Helpers for error tracking
- `context/Web3Context.js` - Integrated

---

## ELK Stack (Log Aggregation)

### Install Locally (No Docker)

**Option 1: Elastic Cloud (Free Tier)**
1. Go to [cloud.elastic.co](https://cloud.elastic.co) → free account
2. Create deployment → get Cloud ID and API key

**Option 2: Local Installation**

```bash
# macOS
brew install elasticsearch kibana logstash

# Ubuntu
# Download from elastic.co (no Docker needed)
```

### Environment Variables
```bash
# In frontend/.env.local
NEXT_PUBLIC_ELASTICSEARCH_URL=https://your-elastic.cloud:9243
NEXT_PUBLIC_ELASTICSEARCH_API_KEY=your-api-key
NEXT_PUBLIC_ELASTICSEARCH_INDEX_PREFIX=sanjeevni
```

### Files
- `lib/elk.js` - Logging functions

### Usage
```javascript
import { logEvent, logError, logContractEvent, logUserAction, logTransaction, logPerformance } from '@/lib/elk';

// Log events
logEvent('category', 'action', { key: 'value' });

// Log errors
logError(error, { context: 'your_context' });

// Log smart contract events
logContractEvent('AccessGranted', { patient: '0x...', doctor: '0x...' });

// Log user actions
logUserAction('form_submit', { form: 'patient_signup', status: 'success' });

// Log transactions
logTransaction('0xabc...', 'addRecord', { gasUsed: '21000' });

// Log performance metrics
logPerformance('page_load', 1250, { page: 'dashboard' });
```

### Auto-Tracked (Web3Context)
- `wallet_connected` - With address, network
- `wallet_disconnected`
- Contract errors

### Features
- Queue-based logging (won't block UI)
- Batch sending with keepalive
- Kibana-ready JSON format
- Includes: timestamp, URL, user agent, viewport
- Different log levels: info, error
- Performance metrics support
- Index rotation by date (`sanjeevni-2025-04-09`)