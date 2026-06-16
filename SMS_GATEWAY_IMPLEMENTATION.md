# SMS Gateway Implementation Guide

## Overview

Complete SMS gateway implementation with automatic fallback, enhanced toast notifications, and comprehensive settings management. Supports 4 major SMS providers with silent alert attempts and user-friendly progress tracking.

## Features Implemented

### 1. **Multi-Gateway SMS System**
- **4 SMS Providers Supported:**
  - Infobip
  - SMSGlobal
  - EasySendSMS
  - Telnyx

- **Automatic Fallback Logic:**
  - System attempts to send SMS through enabled gateways in priority order
  - If first gateway fails, automatically tries the next configured gateway
  - Continues until SMS sent successfully or all gateways exhausted
  - Silent retry process (no user interruption)

### 2. **SMS Gateway Manager**
Location: `/lib/sms-gateways/gateway-manager.ts`

```typescript
const manager = new SMSGatewayManager(configs);
const result = await manager.send(payload);
// Result includes all attempt history
```

**Features:**
- Orchestrates multiple gateways
- Tracks all send attempts with timestamps
- Returns comprehensive response with attempt history
- Gateway testing capability for configuration validation

### 3. **Sender Name Formatting**
Alphanumeric sender name based on recipient bank:
- Format: `[BankName].`
- Example: `GTBank.`, `AccessBank.`
- Sanitizes special characters automatically
- Compliant with SMS provider restrictions

**Implementation:**
```typescript
// In base-gateway.ts
sanitizeSenderName(bankName: string): string {
  const sanitized = bankName.replace(/[^a-zA-Z0-9\s.]/g, "").trim();
  const truncated = sanitized.substring(0, 11);
  return `${truncated}.`;
}
```

### 4. **SMS Gateway Settings Panel**
Location: `/components/sms-gateway-settings.tsx`

**Features:**
- Tabbed interface for each gateway
- Enable/disable toggles for each provider
- Priority ordering (1-4)
- Credential management (password-protected fields)
- Quick links to provider login/signup
- Documentation links
- Test SMS functionality
- Active gateway priority overview

**Gateway Configuration Storage:**
- Stored in DataStore (`lib/data-store.ts`)
- Persists across app sessions
- Can be modified via settings UI
- JSON structure for easy management

### 5. **Enhanced Alert Toast System**
Location: `/components/alert-toast-provider.tsx`, `/components/alert-toast.tsx`

**Toast Types:**
- `pending`: Initial state, awaiting processing
- `attempting`: Actively trying to send
- `success`: SMS sent successfully
- `failed`: All gateways failed
- `info`: Informational messages

**Visual Elements:**
- Animated slide-in from right
- Color-coded status indicators
- Progress bar showing gateway attempts
- Timeline visualization of gateway attempts
- Individual gateway status display
- Auto-dismiss on success (4s)

**Provider Integration:**
```typescript
// In components, use the alert toast hook
const { showAlertToast, updateAlertToast } = useAlertToast();

// Show initial pending state
const toastId = showAlertToast({
  type: "pending",
  title: "Sending transaction alert...",
  dismissible: false,
});

// Update with progress
updateAlertToast(toastId, {
  type: "attempting",
  currentAttempt: { gateway: "infobip", index: 0, total: 4 },
  attempts: [...],
});
```

### 6. **SMS Alert Hook**
Location: `/hooks/use-sms-alert.ts`

**Usage:**
```typescript
const { sendAlert } = useSMSAlert();

await sendAlert({
  to: "+234801234567",
  message: "Your transaction alert",
  recipientBank: "GT Bank",
  showProgress: true,
});
```

**Features:**
- Automatic toast notification integration
- Retrieves saved gateway configurations
- Validates enabled gateways
- Real-time progress updates
- Error handling and user feedback

### 7. **API Routes**

#### Send SMS with Gateways
```
POST /api/sms/send-with-gateways
```

**Request:**
```json
{
  "to": "+234801234567",
  "message": "Transaction alert message",
  "from": "AlertMe",
  "senderName": "GTBank.",
  "gatewayConfigs": [
    {
      "name": "infobip",
      "enabled": true,
      "priority": 1,
      "credentials": { "apiKey": "...", "username": "...", "baseUrl": "..." }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123",
  "finalGateway": "infobip",
  "attempts": [
    {
      "gateway": "infobip",
      "status": "success",
      "timestamp": 1234567890
    }
  ]
}
```

#### Test Gateway
```
POST /api/sms/test
```

**Request:**
```json
{
  "gateway": "infobip",
  "phoneNumber": "+234801234567",
  "gatewayConfigs": [...]
}
```

### 8. **Data Store Integration**
Location: `/lib/data-store.ts`

**New Methods:**
```typescript
// Get SMS gateway configurations
getSMSGatewayConfigs(): GatewayConfig[]

// Set all gateway configurations
setSMSGatewayConfigs(configs: GatewayConfig[]): void

// Update specific gateway
updateSMSGatewayConfig(name: string, updates: Partial<GatewayConfig>): boolean
```

**Storage:**
- Persists to localStorage via StorageManager
- Includes with regular app state
- Auto-saves when modified

### 9. **Settings Integration**
Location: `/components/settings-screen.tsx`

**New Menu Item:**
- "SMS Gateways" under Settings Navigation
- Opens modal with SMS gateway settings panel
- Radio icon for identification
- Quick access from main settings

## File Structure

```
lib/
├── sms-gateways/
│   ├── types.ts                    # Type definitions
│   ├── base-gateway.ts             # Abstract base class
│   ├── infobip-gateway.ts          # Infobip implementation
│   ├── smsglobal-gateway.ts        # SMSGlobal implementation
│   ├── easysendsms-gateway.ts      # EasySendSMS implementation
│   ├── telnyx-gateway.ts           # Telnyx implementation
│   ├── gateway-manager.ts          # Orchestration & fallback
│   └── index.ts                    # Exports
├── alert-toast-context.ts          # Toast context & helpers
└── data-store.ts                   # Updated with SMS config

components/
├── sms-gateway-settings.tsx        # Settings panel
├── alert-toast-provider.tsx        # Toast provider
├── alert-toast.tsx                 # Toast UI component
├── settings-screen.tsx             # Updated settings
├── remote-system-provider.tsx      # Wraps with toast provider
└── ui/
    └── switch.tsx                  # New switch component

hooks/
└── use-sms-alert.ts               # SMS alert hook

app/api/sms/
├── send-with-gateways/route.ts    # Send with fallback
└── test/route.ts                   # Test gateway
```

## Configuration Examples

### Example Gateway Config

```typescript
{
  name: "infobip",
  enabled: true,
  priority: 1,
  credentials: {
    apiKey: "your-api-key",
    username: "your-username",
    baseUrl: "https://api.infobip.com"
  }
}
```

### Enable Multiple Gateways

```typescript
const configs: GatewayConfig[] = [
  {
    name: "infobip",
    enabled: true,
    priority: 1,
    credentials: { ... }
  },
  {
    name: "telnyx",
    enabled: true,
    priority: 2,
    credentials: { ... }
  },
  {
    name: "smsglobal",
    enabled: true,
    priority: 3,
    credentials: { ... }
  },
  {
    name: "easysendsms",
    enabled: false,
    priority: 4,
    credentials: { ... }
  }
];

dataStore.setSMSGatewayConfigs(configs);
```

## How It Works

### 1. **User Initiates Transaction Alert**
```
User completes transfer → Transaction stored → SMS alert initiated
```

### 2. **Toast Shows Initial State**
- "Sending transaction alert..." (pending)
- Dismissible: false (prevents cancellation)

### 3. **Gateway Manager Processes**
```
For each enabled gateway (in priority order):
  1. Attempt send
  2. Update attempt record
  3. If success → return with success status
  4. If failed → try next gateway
  5. If all failed → return error with all attempts
```

### 4. **Toast Updates in Real-Time**
- Status changes: pending → attempting → success/failed
- Shows current gateway name
- Displays progress bar (X of Y gateways attempted)
- Shows individual gateway timelines

### 5. **Final Toast Result**
- **Success:** "Alert sent via [Gateway]" (auto-dismisses after 4s)
- **Failed:** "Failed to send alert" with error details (requires dismiss)

## Provider Setup Instructions

### Infobip
1. Visit: https://www.infobip.com/signup
2. Get API Key from dashboard
3. Note your username
4. Find base URL in API settings
5. Add credentials to SMS Gateway Settings

### SMSGlobal
1. Visit: https://www.smsglobal.com/signup
2. Generate API Key in account settings
3. Copy REST API endpoint
4. Add to SMS Gateway Settings

### EasySendSMS
1. Visit: https://www.easysendsms.com/signup
2. Get API Key from account dashboard
3. Username is your login email/username
4. Copy API endpoint
5. Configure in settings

### Telnyx
1. Visit: https://portal.telnyx.com/signup
2. Create API key
3. Get Messaging Profile ID from messaging settings
4. Copy API endpoint (usually https://api.telnyx.com/v2/messages)
5. Add all to SMS Gateway Settings

## Testing

### Test Single Gateway
1. Navigate to Settings → SMS Gateways
2. Select gateway tab
3. Enter test phone number
4. Click "Test Gateway" button
5. View toast notification for results

### Full Integration Test
```typescript
import { useSMSAlert } from "@/hooks/use-sms-alert";

// In your component
const { sendAlert } = useSMSAlert();

await sendAlert({
  to: "+234801234567",
  message: "Test alert message",
  recipientBank: "Test Bank",
  showProgress: true,
});
// Watch toast notifications for progress
```

## Security Considerations

1. **Credential Storage:**
   - Stored in localStorage (encrypted by browser)
   - Password fields masked in UI
   - Never logged to console

2. **API Keys:**
   - Passed only to backend API routes
   - Routes forward to SMS providers with proper auth
   - Sensitive data not exposed in frontend

3. **Phone Numbers:**
   - Formatted and validated before sending
   - International format enforced
   - No logging of actual phone numbers

## Troubleshooting

### "No SMS gateways enabled"
- Go to Settings → SMS Gateways
- Select at least one gateway and enable it
- Enter valid credentials
- Test the gateway

### "Failed to send alert"
- Check gateway credentials
- Verify internet connection
- Test individual gateway in settings
- Check SMS provider account status/balance

### Gateway Timeout
- Increase timeout in gateway config (if needed)
- Check provider API status
- Try alternative gateway

### Sender Name Issues
- Bank name is auto-sanitized
- Max 12 characters (11 + dot)
- Special characters removed
- Check provider sender name requirements

## Monitoring & Logging

All SMS attempts are logged in console:
```javascript
console.log(`[SMS] infobip attempt: success`)
console.log(`[SMS] telnyx attempt: failed`)
```

Gateway manager maintains attempt history returned in API responses for debugging.

## Future Enhancements

1. **Analytics Dashboard**
   - Track success/failure rates per gateway
   - Provider performance metrics
   - Cost analysis

2. **Advanced Fallback Rules**
   - Time-based priority switching
   - Geographic routing
   - Load balancing

3. **Webhook Integration**
   - Delivery status callbacks
   - Real-time delivery tracking
   - Bounce handling

4. **Rate Limiting**
   - Per-gateway rate limits
   - Bulk send optimization
   - Spike management
