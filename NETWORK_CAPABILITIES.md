# Network Capabilities & Requirements

## Overview
AlertMe Client is a Pan-African banking mobile application built with Next.js 15 and React. The application implements comprehensive network communication patterns including real-time messaging, SMS delivery, and secure transaction processing.

---

## Network Architecture

### Core Protocols
- **WebSocket**: Real-time bidirectional communication via Socket.io
- **HTTP/REST**: Standard API endpoints for data operations
- **HTTPS**: Secure encrypted communication for sensitive operations
- **Web Bluetooth API**: Device-to-device communication for SMS sharing

### Technology Stack
- **Framework**: Next.js 15 (React 19)
- **Runtime**: Node.js v18+
- **Real-time Communication**: Socket.io (client-side)
- **HTTP Client**: Fetch API (native browser)
- **Data Persistence**: IndexedDB, LocalStorage
- **Port Configuration**: Default 3000 (development), configurable for production

---

## API Endpoints

### SMS Gateway Integration
```
POST /api/sms/send
POST /api/sms/send-with-gateways
POST /api/sms/test
POST /api/sms/verify
POST /api/sms/webhook
```

**Purpose**: Multi-gateway SMS delivery with automatic fallback orchestration

**Supported Gateways**:
1. Infobip - Primary gateway with 99.9% uptime SLA
2. SMSGlobal - Secondary failover provider
3. EasySendSMS - Tertiary backup gateway
4. Telnyx - Quaternary fallback option

**Gateway Selection Logic**:
- Attempts delivery in priority order
- Automatically retries on failure
- Logs attempts and results for analytics
- Sends alerts silently without user interruption
- Fallback occurs on HTTP errors, timeouts, or authentication failures

**Request/Response Format**:
```json
{
  "to": "+234801234567",
  "message": "Your transfer of ₦50,000 to Sarah Johnson was successful",
  "senderName": "GTBank.",
  "gatewayConfigs": [
    {
      "name": "infobip",
      "enabled": true,
      "priority": 1,
      "credentials": {
        "apiKey": "xxx",
        "username": "xxx",
        "baseUrl": "https://api.infobip.com"
      }
    }
  ],
  "timeout": 5000
}
```

**Response**:
```json
{
  "success": true,
  "gatewayUsed": "infobip",
  "messageId": "msg_12345678",
  "timestamp": "2024-01-15T14:30:00Z",
  "attempts": [
    {
      "gateway": "infobip",
      "status": "success",
      "timestamp": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### Additional API Routes
```
POST /api/sms/business-card     - vCard generation and sharing
GET  /api/sms/metrics           - SMS delivery analytics
POST /api/vcard                 - Virtual card creation
GET  /api/sw                    - Service worker endpoint
```

---

## Real-time Communication (WebSocket)

### Socket.io Configuration
- **Namespace**: Default (/)
- **Reconnection**: Enabled with exponential backoff
- **Max Reconnection Attempts**: 10
- **Reconnection Delay**: 1000ms initial, up to 30000ms
- **Heartbeat Interval**: 25000ms (ping/pong)

### Connection Indicators
- **Status Dot on Dashboard**: Green (connected), Red (disconnected)
- **Auto-reconnect**: Transparent to user
- **Connection Events**: Monitored in real-time on dashboard header

### Emitted Events
```javascript
// Client → Server
'transaction:complete'     - Transaction finished
'alert:sent'              - Alert delivery confirmed
'user:online'             - User session started
'location:update'         - Location data sync

// Server → Client
'transaction:update'      - Real-time transaction status
'alert:delivered'         - SMS delivery confirmation
'balance:update'          - Account balance change
'notification:new'        - Incoming notification
```

---

## Security & Compliance

### Authentication
- PIN-based authentication (4-digit)
- Default Credentials for Demo:
  - Account Number: `0099348976`
  - PIN: `1234`
- BVN verification (stored as `22123456789`)
- Session persistence via IndexedDB

### Data Encryption
- HTTPS enforced for all API calls
- SMS credentials stored encrypted in localStorage
- Access tokens not stored client-side
- Sensitive data cleared on logout

### Rate Limiting
- SMS: 10 attempts per recipient per hour
- Transactions: 100 per day per account
- API calls: 1000 per minute per session
- Retry limits: Max 3 automatic fallback attempts

---

## Data Models

### Transaction Model
```typescript
{
  id: string
  type: string                      // "Transfer", "Deposit", "Bill Payment"
  amount: number
  recipient?: string
  sender?: string
  date: string                      // YYYY-MM-DD
  time: string                      // HH:MMAM/PM
  status: "Successful" | "Pending" | "Failed"
  reference: string                 // Unique TXN reference
  description: string
  isDebit: boolean
  section: string                   // "Today", "Yesterday", "Jan 13"
  recipientBank?: string
  senderBank?: string
  recipientAccount?: string
  senderAccount?: string
  fee?: number                      // Transaction fee in Naira
}
```

### Beneficiary Model
```typescript
{
  id: string
  name: string
  accountNumber: string             // 10-digit account number
  bank: string                      // Bank name or platform
  phone?: string                    // E.164 format: +234xxxxxxxxxx
}
```

### User Model
```typescript
{
  name: string
  accountNumber: string             // Masked as ****6976 in UI
  phone: string
  balance: number                   // 3,500,000.00 NGN in demo
  email: string
  address: string
  bvn: string                       // 11-digit number
  status: "Active" | "Inactive"
  profilePicture?: string           // Base64 or URL
}
```

### SMS Gateway Config Model
```typescript
{
  name: string                      // "infobip", "smsglobal", etc.
  enabled: boolean
  priority: number                  // 1-4 for fallback order
  credentials: {
    apiKey: string
    username?: string
    endpoint?: string
    baseUrl?: string
    messagingProfileId?: string
  }
}
```

---

## Network Flow Examples

### Successful Transaction with SMS Delivery
```
1. User initiates transfer (domestic-transfer-form)
   → Validates form data (account, amount, bank, beneficiary)
   
2. PIN confirmation (pin-confirmation component)
   → User enters 4-digit PIN
   
3. Transaction processing (transaction-success component)
   → Adds transaction to history
   → Updates account balance
   → Adds notification
   
4. SMS Delivery (send-with-gateways)
   → Gateway Manager selects primary gateway (Infobip)
   → Sends SMS with masked sender name (e.g., "GTBank.")
   → On failure, automatically tries SMSGlobal
   → If still failing, tries EasySendSMS
   → Final fallback to Telnyx
   
5. Receipt Generation (detailed-receipt-screen)
   → Displays all transaction details
   → User can share via WhatsApp, Email, SMS, Bluetooth
   
6. User navigates back
   → Receipt information persists
   → Back button returns to transaction detail
```

### SMS Delivery Fallback Flow
```
Initial Request
    ↓
Try Infobip (Priority 1)
    ├─ Success → Return
    └─ Fail → Next
    
Try SMSGlobal (Priority 2)
    ├─ Success → Return
    └─ Fail → Next
    
Try EasySendSMS (Priority 3)
    ├─ Success → Return
    └─ Fail → Next
    
Try Telnyx (Priority 4)
    ├─ Success → Return
    └─ Fail → Log Error & Notify User
```

---

## Unfinished / Known Issues

### Network Communication

#### 1. **WebSocket Connection Persistence**
- **Issue**: Socket.io reconnection doesn't always restore previous subscriptions
- **Impact**: User may miss real-time updates on network interruption
- **Status**: PENDING
- **Solution**: Need to implement subscription manager to re-subscribe after reconnect
- **Priority**: HIGH

#### 2. **SMS Gateway Credentials Validation**
- **Issue**: No real-time validation of credentials before attempting send
- **Impact**: Multiple failed attempts before user realizes credentials are wrong
- **Status**: PENDING
- **Solution**: Add test endpoint to validate credentials before saving
- **Priority**: MEDIUM

#### 3. **Offline Mode Support**
- **Issue**: Application doesn't work offline; no queue for pending transactions
- **Impact**: Users in areas with poor connectivity lose unsent transactions
- **Status**: NOT STARTED
- **Solution**: Implement Service Worker with background sync API
- **Priority**: HIGH

#### 4. **Transaction History Sync**
- **Issue**: Transaction history only syncs on app load; doesn't fetch new transactions in real-time
- **Impact**: User sees stale transaction history
- **Status**: PENDING
- **Solution**: Subscribe to transaction:update events via Socket.io
- **Priority**: MEDIUM

#### 5. **SMS Delivery Confirmation**
- **Issue**: No webhook callback to confirm SMS was actually delivered to recipient phone
- **Impact**: App shows "sent" but SMS may still fail silently
- **Status**: PENDING
- **Solution**: Implement webhook handlers for SMS delivery receipts from all gateways
- **Priority**: HIGH

#### 6. **Rate Limiting Handling**
- **Issue**: No client-side rate limiting; server errors on exceeding limits aren't graceful
- **Impact**: Users see cryptic error messages instead of "Try again later"
- **Status**: PENDING
- **Solution**: Implement queue system with exponential backoff
- **Priority**: MEDIUM

#### 7. **Error Recovery**
- **Issue**: Network errors aren't always logged for debugging
- **Impact**: Hard to diagnose production issues
- **Status**: PENDING
- **Solution**: Implement error telemetry with error tracking service
- **Priority**: MEDIUM

#### 8. **Timeout Handling**
- **Issue**: No configurable timeouts for different API call types
- **Impact**: Long operations may hang without user feedback
- **Status**: PENDING
- **Solution**: Add timeout configurations per endpoint
- **Priority**: LOW

---

## Environment Variables Required

### SMS Gateway Configuration
```env
# Infobip
INFOBIP_API_KEY=xxx
INFOBIP_USERNAME=xxx
INFOBIP_BASE_URL=https://api.infobip.com

# SMSGlobal
SMSGLOBAL_API_KEY=xxx
SMSGLOBAL_ENDPOINT=https://api.smsglobal.com

# EasySendSMS
EASYSENDSMS_API_KEY=xxx
EASYSENDSMS_USERNAME=xxx
EASYSENDSMS_ENDPOINT=https://api.easysendsms.com

# Telnyx
TELNYX_API_KEY=xxx
TELNYX_MESSAGING_PROFILE_ID=xxx
TELNYX_ENDPOINT=https://api.telnyx.com
```

### WebSocket Configuration
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
SOCKET_RECONNECTION_ENABLED=true
SOCKET_RECONNECTION_ATTEMPTS=10
SOCKET_RECONNECTION_DELAY=1000
```

### Application
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api
DEBUG=true
```

---

## Network Performance Metrics

### Expected Response Times
- SMS Send: 2-5 seconds (with fallback)
- Transaction Submit: 3-8 seconds
- Balance Update: 500ms
- Receipt Generation: <100ms
- WebSocket Connect: 1-2 seconds

### Bandwidth Usage (estimated per session)
- Login: 50KB
- Dashboard Load: 200KB
- Transaction: 100KB
- SMS Send: 10KB
- WebSocket: 1-2KB per message

---

## Testing Network Issues

### Simulate Connection Loss
```javascript
// DevTools Console
window.remoteSystem.disconnect()
// Reconnect
window.remoteSystem.connect()
```

### Simulate Slow Network
- Use DevTools Network tab
- Set throttle to "Slow 4G"
- Monitor connection indicator on dashboard

### Test SMS Fallback
1. Disable Infobip credentials in settings
2. Send transaction with SMS enabled
3. Watch toast notifications for fallback attempts

---

## Deployment Considerations

### Production Requirements
- HTTPS certificate (SSL/TLS)
- WebSocket proxy configuration (nginx/Apache)
- CORS headers configured for domain
- Rate limiting at reverse proxy level
- Database replication for failover
- SMS gateway accounts verified and funded

### Recommended Configuration
```nginx
upstream api {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /socket.io {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_buffering off;
    }
}
```

---

## Support & Troubleshooting

### Common Issues

**"SMS Not Sending"**
- Check SMS gateway credentials in settings
- Verify recipient phone number format (+234...)
- Check SMS gateway account balance/quota
- Review logs in SMS gateway dashboard

**"WebSocket Disconnected (Red Dot)"**
- Check internet connection
- Verify server is running
- Check browser console for errors
- Try refreshing the page

**"Transaction Stuck in Pending"**
- Wait 5-10 minutes for bank processing
- Check internet connection
- Review transaction history
- Contact support with transaction ID

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('debug', 'true')
// Check browser console for [v0] messages
```

---

## Future Roadmap

### Q1 2024
- [ ] Offline transaction queue (Service Worker)
- [ ] SMS delivery webhook integration
- [ ] Real-time transaction sync via Socket.io
- [ ] Multi-currency support with live rates

### Q2 2024
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] End-to-end encryption for sensitive data
- [ ] Rate limiting with smart backoff
- [ ] Comprehensive error telemetry

### Q3 2024
- [ ] GraphQL API layer
- [ ] Server-Sent Events (SSE) as WebSocket alternative
- [ ] Webhook system for third-party integrations
- [ ] Advanced network monitoring dashboard

---

## References

- [Socket.io Documentation](https://socket.io/docs/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [SMS Gateway Documentation](https://www.infobip.com/docs)

---

**Last Updated**: January 15, 2024  
**Version**: 1.0.0  
**Maintainer**: AlertMe Development Team
