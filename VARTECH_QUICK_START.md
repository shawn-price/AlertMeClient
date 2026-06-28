# VarTech SMS Gateway - Quick Start Guide

## 5-Minute Setup

### Step 1: Set Environment Variables
```bash
# Create or update .env.local
VARTECH_API_KEY=your_api_key_from_vartech
VARTECH_BASE_URL=https://sms.thevartech.com/api
VARTECH_SENDER_ID=AlertMe
```

### Step 2: Start Development Server
```bash
npm run dev
# Server runs at http://localhost:3000
```

### Step 3: Test SMS Sending
```bash
# Option A: Using cURL
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+234801234567","message":"Hello VarTech!"}'

# Option B: Using Node.js script
node scripts/vartech-test.js "+234801234567" "Hello VarTech!"

# Option C: Using the UI
# Navigate to Settings > SMS Configuration > Test tab
# Enter phone number and click Test button
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VARTECH_API_KEY` | Yes | - | Your VarTech API key |
| `VARTECH_BASE_URL` | Yes | https://sms.thevartech.com/api | VarTech API endpoint |
| `VARTECH_SENDER_ID` | No | AlertMe | Display name for SMS sender |
| `VARTECH_TIMEOUT` | No | 30000 | Request timeout in ms |
| `VARTECH_RETRY_ATTEMPTS` | No | 3 | Number of retry attempts |
| `VARTECH_RETRY_DELAY_MS` | No | 1000 | Initial retry delay in ms |
| `VARTECH_ENABLED` | No | true | Enable/disable gateway |
| `SMS_DEMO_MODE` | No | false | Use demo mode (no API needed) |

## API Endpoints

### Send SMS
**POST** `/api/sms/send`
```json
{
  "to": "+234801234567",
  "message": "Your SMS message",
  "type": "notification"
}
```

### Test SMS
**POST** `/api/sms/test`
```json
{
  "phoneNumber": "+234801234567"
}
```

### Verify Gateway
**GET** `/api/sms/verify`

### Get Settings
**GET** `/api/settings/vartech-config`

### Update Settings
**POST** `/api/settings/vartech-config`
```json
{
  "enabled": true,
  "apiKey": "your_key",
  "baseUrl": "https://sms.thevartech.com/api",
  "senderId": "AlertMe",
  "timeout": 30000,
  "retryAttempts": 3,
  "retryDelayMs": 1000
}
```

### Run Test Suite
**GET** `/api/sms/test-suite`

## Demo Mode (Test Without Credentials)

### Enable Demo Mode
```bash
export SMS_DEMO_MODE=true
npm run dev
```

### What Changes
- SMS endpoints return simulated responses
- No VarTech credentials needed
- Useful for testing UI and workflows
- Returns demo message IDs

### Example Response
```json
{
  "success": true,
  "messageId": "DEMO_1234567890_abc123",
  "status": "demo",
  "demo": true
}
```

## Common Tasks

### Configure VarTech in UI
1. Go to **Settings** (gear icon)
2. Click **SMS Configuration**
3. Enter your VarTech credentials
4. Click **Save Configuration**

### Test SMS Sending
1. In Settings > SMS Configuration > Test tab
2. Enter a phone number
3. Click the test button (🧪)
4. Check for success message

### Configure Advanced Settings
1. In Settings > SMS Configuration > Advanced tab
2. Adjust timeout, retries, retry delay as needed
3. Click **Save Configuration**

## Troubleshooting

### "VarTech SMS service not configured"
```bash
# Check environment variables
echo $VARTECH_API_KEY
echo $VARTECH_BASE_URL

# Or use demo mode
export SMS_DEMO_MODE=true
```

### "Rate limit exceeded"
- The API rate-limits per IP
- Wait before retrying
- Check `Retry-After` header

### "Unable to reach VarTech API"
- Verify internet connectivity
- Check Base URL is correct
- Verify VarTech service is online
- Check firewall/proxy settings

### SMS Not Sending
1. Verify API key is correct
2. Verify phone number format (e.g., +234...)
3. Check logs: `npm run dev`
4. Test with demo mode first
5. Run test suite: `/api/sms/test-suite`

## Testing Methods

### 1. Using Test Script (Fastest)
```bash
node scripts/vartech-test.js "+234801234567" "Test message"
```

### 2. Using cURL (Easy)
```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+234801234567","message":"Test"}'
```

### 3. Using Settings UI (Visual)
- Navigate to Settings > SMS Configuration > Test
- Enter phone number
- Click test button

### 4. Using Test Suite (Comprehensive)
- Visit `http://localhost:3000/api/sms/test-suite`
- See all diagnostics in one place

### 5. Using Node.js
```javascript
const response = await fetch('/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+234801234567',
    message: 'Hello!',
    type: 'notification'
  })
});

const result = await response.json();
console.log(result);
```

## Advanced Configuration

### Custom Timeout
```bash
export VARTECH_TIMEOUT=60000  # 60 seconds
```

### Custom Retries
```bash
export VARTECH_RETRY_ATTEMPTS=5
export VARTECH_RETRY_DELAY_MS=2000
```

### Disable Gateway
```bash
export VARTECH_ENABLED=false
```

## Files Structure

```
project/
├── lib/
│   └── sms-gateways/
│       ├── vartech-gateway.ts          # Core gateway
│       ├── types.ts                    # Type definitions
│       └── gateway-manager.ts          # Gateway manager
├── components/
│   └── vartech-sms-settings.tsx        # Settings UI
├── app/api/
│   ├── sms/
│   │   ├── send/route.ts               # Send SMS
│   │   ├── test/route.ts               # Test SMS
│   │   ├── verify/route.ts             # Verify config
│   │   ├── webhook/route.ts            # Webhooks
│   │   └── test-suite/route.ts         # Test suite
│   └── settings/
│       └── vartech-config/route.ts     # Settings API
└── scripts/
    └── vartech-test.js                 # Test script
```

## Documentation Files

- **VARTECH_SMS_TESTING.md** - Comprehensive testing guide
- **MIGRATION_SUMMARY.md** - Complete migration details
- **TESTING_VERIFICATION.md** - Verification checklist
- **VARTECH_QUICK_START.md** - This file

## Links

- **VarTech API Docs**: https://sms.thevartech.com/api-doc
- **VarTech Dashboard**: https://sms.thevartech.com
- **VarTech Sign Up**: https://sms.thevartech.com/signup

## Key Features

✅ **Easy Setup** - Just add API key and sender ID  
✅ **Demo Mode** - Test without credentials  
✅ **Auto Retry** - Configurable retry logic  
✅ **Settings UI** - Configure from browser  
✅ **Test Tools** - Multiple testing methods  
✅ **Comprehensive Logs** - Full error reporting  
✅ **Production Ready** - Tested and verified  

## Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run lint                   # Run linter

# Testing
node scripts/vartech-test.js "+234..." "message"  # Test script
npm run dev                    # Start and test locally

# Environment
export VARTECH_API_KEY=...     # Set API key
export SMS_DEMO_MODE=true      # Enable demo mode
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "status": "sent",
  "type": "notification"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "details": "An error occurred while sending the SMS."
}
```

### Demo Response
```json
{
  "success": true,
  "messageId": "DEMO_1234567890_abc123",
  "status": "demo",
  "demo": true,
  "details": "SMS sent in demo mode (VarTech credentials not configured)"
}
```

## Next Steps

1. **Setup**: Add environment variables to `.env.local`
2. **Test**: Run `node scripts/vartech-test.js "+234..." "test"`
3. **Verify**: Visit `/api/sms/verify` to check connection
4. **Configure**: Use Settings UI to adjust advanced options
5. **Deploy**: Push to production with environment variables set

---

**Ready to send SMS with VarTech!** 🚀
