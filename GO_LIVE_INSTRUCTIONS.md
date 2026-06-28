# AlertMe Production SMS - Go Live Instructions

## 🚀 Ready to Send Real SMS Alerts

Your AlertMe application is now fully configured to send production SMS alerts via VarTech. Follow these steps to go live.

---

## STEP 1: Configure Your VarTech Account

### Create VarTech Account
1. Visit https://sms.thevartech.com/signup
2. Create account with your business details
3. Verify email and phone number
4. Complete KYC verification
5. Add payment method to your account

### Get API Credentials
1. Log into VarTech dashboard
2. Navigate to Settings → API Keys
3. Generate new API key (keep it secret!)
4. Note your Sender ID (business name)
5. Confirm API base URL: https://sms.thevartech.com/api

---

## STEP 2: Configure Vercel Environment Variables

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your AlertMe project
3. Click **Settings** → **Environment Variables**
4. Add three variables:

| Variable | Value |
|----------|-------|
| `VARTECH_API_KEY` | Your API key from VarTech |
| `VARTECH_BASE_URL` | https://sms.thevartech.com/api |
| `VARTECH_SENDER_ID` | Your business name (e.g., AlertMe) |

5. Select **Production** environment
6. Click **Save**

### Redeploy After Adding Variables
```bash
# If using Vercel CLI
vercel --prod

# Or push to your main branch
git push origin main
```

---

## STEP 3: Test Production SMS (Before Going Live)

### Test 1: Quick Verification
```bash
curl -X POST https://your-app.vercel.app/api/sms/verify \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "gateway": "VarTech SMS",
  "status": "connected"
}
```

### Test 2: Send Test Transaction Alert
```bash
curl -X POST https://your-app.vercel.app/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "transaction"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Production SMS test sent successfully (transaction)",
  "result": {
    "success": true,
    "smsStatus": "sent"
  }
}
```

### Test 3: Via App UI
1. Open your app: https://your-app.vercel.app
2. Go to **Settings** → **SMS Configuration**
3. Click **"Test Gateway"** tab
4. Enter your phone number (format: +2348012345678)
5. Click **"Send Test SMS"**
6. ✅ Check your phone for SMS within 2-3 seconds

### Test 4: End-to-End Transaction Test
1. In the app, navigate to **Transfer Money**
2. Create a test transfer
3. Confirm transfer
4. Watch success screen show "SMS sent"
5. ✅ Both phones should receive alerts within 5 seconds

---

## STEP 4: Verify All Alert Types

### Notification Test
```bash
curl -X POST https://your-app.vercel.app/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "notification"
  }'
```

### Verification Code Test
```bash
curl -X POST https://your-app.vercel.app/api/sms/production-test \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+2348012345678",
    "testType": "verification"
  }'
```

---

## STEP 5: Configure Webhook for Delivery Reports (Optional)

### Enable Delivery Notifications
1. Log into VarTech dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-app.vercel.app/api/sms/webhook`
4. Select events: **Delivery Status**, **Failures**
5. Click **Save**

Your app will now receive delivery confirmations from VarTech.

---

## STEP 6: Monitor SMS Status

### Via App Process Log
1. Open your app
2. Go to **Settings** → **Process Log**
3. View real-time SMS activity:
   - Timestamp of each SMS
   - Success/failure status
   - Message ID
   - Recipient phone number

### Via VarTech Dashboard
1. Log into https://sms.thevartech.com
2. Dashboard shows:
   - SMS count
   - Delivery status
   - Failed messages
   - Account balance

---

## STEP 7: Set Up Monitoring & Alerts

### Monitor VarTech Account Balance
- **Check regularly** via VarTech dashboard
- **Alert threshold:** Set recharge at 20% balance
- **Estimate:** Track average SMS cost per transaction

### Monitor SMS Success Rate
- **Target:** 99%+ success rate
- **Alert:** If drops below 95%, investigate
- **Check:** Settings → Process Log for patterns

### Set Up Failure Notifications
- Monitor for repeated failures
- Check invalid phone numbers
- Verify carrier acceptance

---

## STEP 8: Team Communication

### Tell Your Users
Send notification about new SMS alerts:

> "🔔 AlertMe now sends SMS alerts for every transaction! 
> You'll receive instant confirmations for money sent and received. 
> SMS comes from [YourSenderID]. Never miss a transaction."

### Train Support Team
1. How to check SMS logs (Settings → Process Log)
2. Common issues and troubleshooting
3. How to verify if SMS was sent
4. When to contact VarTech support

### Document for Reference
- Bookmark VarTech API docs: https://sms.thevartech.com/api-doc
- Save these instructions
- Keep API credentials secure (NEVER share)

---

## STEP 9: Production Checklist

Before declaring "GO LIVE", verify:

- [ ] VarTech account created and funded
- [ ] API credentials added to Vercel environment
- [ ] App redeployed after env variables set
- [ ] Verification test passed (/api/sms/verify)
- [ ] Transaction alert received on test phone
- [ ] Notification SMS received on test phone
- [ ] Verification code SMS received on test phone
- [ ] Process Log shows all SMS with status
- [ ] End-to-end transfer test completed
- [ ] Webhook configured (optional)
- [ ] Team trained on new SMS system
- [ ] Users notified about SMS alerts
- [ ] Error handling verified (test invalid number)
- [ ] Rate limiting acceptable for volume

---

## STEP 10: Go Live!

Once all checks pass:

```bash
# Final deployment
git push origin main

# Verify it's live
curl -X POST https://your-app.vercel.app/api/sms/verify \
  -H "Content-Type: application/json"
```

You're now live with production SMS alerts! 🎉

---

## Monitoring After Launch

### Daily
- Check VarTech dashboard for SMS count
- Verify account balance adequate
- Monitor success rate in Process Log

### Weekly
- Review SMS cost trends
- Check for repeated error patterns
- Gather user feedback on alerts

### Monthly
- Analyze SMS metrics
- Optimize message templates if needed
- Review VarTech usage and optimize plan

---

## Troubleshooting

### SMS Not Sending
1. Check environment variables set: `curl https://your-app.vercel.app/api/sms/verify`
2. Verify VarTech account has balance
3. Review error in Process Log
4. Check phone number format

### SMS Sent But Not Received
1. Verify correct phone number
2. Check carrier isn't blocking
3. Wait 5-10 seconds (network delay)
4. Try different phone number

### High Failed SMS Rate
1. Check phone number formats in logs
2. Verify VarTech credentials correct
3. Check account balance
4. Contact VarTech support

---

## Support

- **VarTech Help:** support@thevartech.com
- **VarTech Docs:** https://sms.thevartech.com/api-doc
- **App Logs:** Settings → Process Log
- **Complete Guide:** See `PRODUCTION_SMS_GUIDE.md`
- **Quick Start:** See `PRODUCTION_SMS_QUICKSTART.md`

---

## You're All Set! 🚀

Your AlertMe users will now receive instant SMS alerts for every transaction. 

**Next Steps:**
1. Configure environment variables
2. Run tests
3. Deploy to production
4. Monitor and celebrate! 🎉

Questions? See `PRODUCTION_SMS_GUIDE.md` for comprehensive documentation.
