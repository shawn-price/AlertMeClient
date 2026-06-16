# SMS Gateway Quick Start Guide

## 30-Second Setup

1. **Open Settings** → SMS Gateways
2. **Pick a Provider** (Infobip recommended)
3. **Get Credentials** from provider website
4. **Enter Credentials** in the settings panel
5. **Test** with your phone number
6. **Save Configuration**

Done! SMS alerts now work automatically.

## Using SMS Alerts in Code

```typescript
import { useSMSAlert } from "@/hooks/use-sms-alert";

function MyComponent() {
  const { sendAlert } = useSMSAlert();

  const handleSendAlert = async () => {
    await sendAlert({
      to: "+234801234567",
      message: "Your ₦50,000 transfer to John was successful",
      recipientBank: "GT Bank",
      showProgress: true,
    });
  };

  return <button onClick={handleSendAlert}>Send Alert</button>;
}
```

## What Happens Automatically

1. **Toast appears:** "Sending transaction alert..."
2. **System tries gateways** in priority order (user doesn't wait)
3. **Toast updates:** Shows which gateway is being attempted
4. **Success:** Toast shows "Alert sent via [Provider]"
5. **Failure:** Toast shows error and allows retry

## Gateway Setup Links

**Quick Links (all in SMS Gateway Settings):**
- **Infobip:** https://www.infobip.com/signup
- **Telnyx:** https://portal.telnyx.com/signup  
- **SMSGlobal:** https://www.smsglobal.com/signup
- **EasySendSMS:** https://www.easysendsms.com/signup

## Common Tasks

### Add a New Gateway
1. Settings → SMS Gateways → [Select Gateway Tab]
2. Click "Sign Up" button
3. Create account and get API key
4. Copy credentials into the settings form
5. Click "Test Gateway"
6. Save Configuration

### Change Gateway Priority
1. Settings → SMS Gateways
2. Adjust "Priority" number (1 = first to try)
3. Save Configuration

### Disable a Gateway
1. Settings → SMS Gateways → [Select Gateway]
2. Toggle off the "Enable" switch
3. Save Configuration

### Test a Gateway
1. Settings → SMS Gateways → [Select Gateway]
2. Enter test phone number
3. Click 🧪 button
4. Check toast for result

## Credentials Needed by Gateway

| Provider | Credentials | Where to Find |
|----------|-------------|---------------|
| **Infobip** | API Key, Username, Base URL | Dashboard → API |
| **Telnyx** | API Key, Messaging Profile ID | Portal → Messaging |
| **SMSGlobal** | API Key, Endpoint | Settings → API |
| **EasySendSMS** | API Key, Username, Endpoint | Account → API |

## Toast Notifications Explained

**What you'll see:**

```
⏳ Sending transaction alert...
(Initial state - system preparing)

⏳ Attempting via Infobip
████░░░░░░ 1/4
(System trying first gateway)

✓ Alert sent via Infobip
(Success - auto-closes in 4 seconds)
```

**Or if fails:**

```
✗ Failed to send alert
  Last error: Invalid API key
(Failed - requires manual dismiss)
```

## Troubleshooting

### Problem: "No SMS gateways enabled"
**Solution:** 
1. Settings → SMS Gateways
2. Select any gateway
3. Toggle "Enable" switch on
4. Save

### Problem: "Failed to send alert"
**Solution:**
1. Settings → SMS Gateways
2. Click "Test Gateway" with your number
3. If test fails, credentials are wrong
4. Verify credentials from provider
5. Resave and test again

### Problem: Wrong Sender Name
**Solution:** 
- Sender name auto-formats to: `BankName.`
- Special characters removed automatically
- Can't be custom (for compliance)
- Example: "GT Bank" → "GTBank."

## Priority System Example

You have 3 gateways enabled:

```
Priority 1: Infobip (enabled)    ← Tries first
Priority 2: Telnyx (enabled)     ← If Infobip fails
Priority 3: SMSGlobal (enabled)  ← If Infobip & Telnyx fail

EasySendSMS: Disabled            ← Skipped
```

If Infobip fails → System automatically tries Telnyx
If Telnyx fails → System automatically tries SMSGlobal
All without user knowing or waiting

## Best Practices

✓ **Enable 2+ gateways** for reliability
✓ **Test before deploying** to production
✓ **Check provider status** if issues occur
✓ **Keep credentials updated** if changed
✓ **Use phone number with country code** (+234...)
✓ **Monitor console logs** for [SMS] entries

## API Response Format

```json
{
  "success": true,
  "messageId": "msg_123abc",
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

## Files to Check

If you need to debug:

1. **Toast Logic:** `components/alert-toast-provider.tsx`
2. **Gateway Config:** `lib/data-store.ts` (getSMSGatewayConfigs)
3. **API Endpoint:** `app/api/sms/send-with-gateways/route.ts`
4. **Gateway Manager:** `lib/sms-gateways/gateway-manager.ts`

## Environment Variables

None required! Credentials are stored in app settings.

(Optional: Can add Twilio if needed later)

## Support

If SMS not sending:
1. Test gateway in settings
2. Check console for `[SMS]` log messages
3. Verify phone number format: `+234...`
4. Ensure at least one gateway is enabled
5. Check provider API status/balance

---

**That's it!** Your SMS gateway system is ready to use. 🚀
