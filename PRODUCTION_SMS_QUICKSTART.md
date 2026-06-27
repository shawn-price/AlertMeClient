# Production SMS - Quick Start Guide

## Step 1: Configure VarTech Credentials

Add your VarTech SMS credentials to your project's environment variables:

**In Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add the following three variables:
   - `VARTECH_API_KEY` - Your VarTech API key
   - `VARTECH_BASE_URL` - https://sms.thevartech.com/api
   - `VARTECH_SENDER_ID` - Your sender ID (e.g., "AlertMe")

**For Local Development:**
Create or update `.env.development.local`:
```bash
VARTECH_API_KEY=your_api_key_here
VARTECH_BASE_URL=https://sms.thevartech.com/api
VARTECH_SENDER_ID=AlertMe
```

## Step 2: Test Production SMS

### Option A: Via cURL (Fastest)

Test a transaction alert:
```bash
curl -X POST https://your-app-domain.vercel.app/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "transaction"
  }'
```

Test a notification:
```bash
curl -X POST https://your-app-domain.vercel.app/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "notification"
  }'
```

### Option B: Via Application UI

1. Open the app in your browser
2. Go to **Settings → SMS Configuration**
3. Click the **"Test Gateway"** tab
4. Enter your test phone number
5. Click **"Send Test SMS"**
6. Check your phone for the message (arrives within 2-5 seconds)

### Option C: Via Direct API Call

**JavaScript:**
```javascript
const response = await fetch('/api/sms/production-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2348012345678',
    testType: 'transaction'
  })
});

const result = await response.json();
console.log('SMS Test Result:', result);
```

**Python:**
```python
import requests

response = requests.post('http://localhost:3000/api/sms/production-test', json={
  'phoneNumber': '+2348012345678',
  'testType': 'transaction'
})

print(response.json())
```

## Step 3: Monitor Real Transaction Alerts

Production alerts are sent automatically when transactions complete:

1. Make a test transfer in the app
2. On success screen, SMS will be marked as "Sending SMS notification..."
3. Watch it change to "SMS sent" (usually 2-3 seconds)
4. Both sender and receiver receive formatted SMS alerts

## Step 4: View Alert History

Check all SMS activity in the app:

1. Open **Settings**
2. Click **"Process Log"** (shows all app actions)
3. Filter for "SMS" or "Alert" type
4. View timestamps, status, and details

## What You Should Receive

### Transaction Alert (Sender):
```
Debit ₦5,000.00 to Test Recipient (08012345678).
Balance: ₦95,000.00. Ref: TXN-123456 from Ecobank.
```

### Transaction Alert (Receiver):
```
Credit ₦5,000.00 from Test User (Ecobank.).
Balance: ₦5,000.00. Ref: TXN-123456
```

## Troubleshooting

### Issue: "SMS service not configured"
**Solution:** Verify environment variables are correctly set in Vercel Settings

### Issue: SMS not sent or error response
**Solution:** 
1. Check API response for specific error message
2. Verify phone number format (+234... or 08...)
3. Check VarTech account has sufficient balance
4. Review VarTech API logs for delivery details

### Issue: SMS sent but not received
**Possible causes:**
- Recipient's network provider blocking SMS
- Number blocked by recipient
- SMS delayed (wait 5-10 seconds)
- Incorrect phone number entered

**Solution:**
- Try with a different phone number
- Check VarTech webhook for delivery status
- Contact VarTech support if issue persists

## Next Steps

Once testing is complete:

1. ✅ Verify all SMS types work (transaction, notification, verification)
2. ✅ Test with real phone numbers from your users
3. ✅ Monitor message delivery success rate
4. ✅ Set up error alerts for failed SMS
5. ✅ Document any custom SMS templates needed
6. ✅ Plan user communication about SMS alerts

## Production Deployment

When deploying to production:

1. Ensure VarTech credentials are in production environment variables
2. Test in staging environment first
3. Monitor SMS delivery for first 24 hours
4. Set up alerts for SMS failures
5. Have support documentation ready for users asking about SMS alerts

## SMS API Documentation

For detailed API documentation: https://sms.thevartech.com/api-doc

## Need Help?

- **VarTech Support:** support@thevartech.com
- **Check logs:** Settings → Process Log (view all SMS actions)
- **API Reference:** See `PRODUCTION_SMS_GUIDE.md` for complete details
