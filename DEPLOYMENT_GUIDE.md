# SMS Gateway Deployment Guide

## Overview

This guide walks you through deploying the updated VarTech SMS gateway implementation to production.

## Pre-Deployment Checklist

### Code Review
- [ ] Review changes in `lib/sms-gateways/vartech-gateway.ts`
- [ ] Verify type updates in `lib/sms-gateways/types.ts`
- [ ] Check API route in `app/api/sms/send/route.ts`
- [ ] Run TypeScript compiler: `tsc --noEmit`
- [ ] Run linter if available

### Testing
- [ ] Test with demo mode enabled (SMS_DEMO_MODE=true)
- [ ] Test basic SMS with actual credentials
- [ ] Test custom fields functionality
- [ ] Test error handling (invalid phone, missing fields)
- [ ] Test rate limiting behavior
- [ ] Verify phone number formatting

### Documentation
- [ ] Review `docs/SMS_API_INTEGRATION.md`
- [ ] Review `docs/QUICK_START.md`
- [ ] Check `IMPLEMENTATION_SUMMARY.md`

## Step-by-Step Deployment

### 1. Local Testing

```bash
# Install dependencies if needed
npm install
# or
pnpm install

# Set environment variables for testing
export VARTECH_API_KEY=your_test_api_key
export VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
export VARTECH_SENDER_ID=AlertMe
export SMS_DEMO_MODE=true

# Run development server
npm run dev

# Test with curl
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234810000000",
    "message": "Test message"
  }'
```

### 2. Build Verification

```bash
# Build the project
npm run build

# Check for TypeScript errors
tsc --noEmit

# Run tests if available
npm test
```

### 3. Environment Configuration

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
VARTECH_API_KEY=your_production_api_key
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
VARTECH_SENDER_ID=AlertMe
SMS_DEMO_MODE=false
```

#### For Other Platforms (AWS, GCP, etc.)

Set these environment variables in your deployment configuration:

```env
VARTECH_API_KEY=your_production_api_key
VARTECH_BASE_URL=https://sms.thevartech.com/smsModule
VARTECH_SENDER_ID=AlertMe
SMS_DEMO_MODE=false
```

### 4. Deployment

#### Vercel Deployment

```bash
# Option 1: Using Vercel CLI
vercel deploy --prod

# Option 2: Auto-deploy from GitHub
# Just push to main branch
git push origin main
```

#### Docker Deployment

If using Docker, ensure environment variables are passed:

```bash
docker run \
  -e VARTECH_API_KEY=your_api_key \
  -e VARTECH_BASE_URL=https://sms.thevartech.com/smsModule \
  -e VARTECH_SENDER_ID=AlertMe \
  -p 3000:3000 \
  your-app-image
```

### 5. Post-Deployment Verification

```bash
# Test the deployed endpoint
curl -X POST https://your-domain.com/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+234810000000",
    "message": "Deployment test"
  }'

# Expected response:
# {
#   "success": true,
#   "messageId": "vartech_...",
#   "status": "sent",
#   "type": "general"
# }
```

## Monitoring and Logging

### Set Up Monitoring

1. **Error Tracking:** Enable error tracking in your monitoring service
   - Vercel Analytics
   - Sentry
   - DataDog
   - New Relic

2. **Logging:** Monitor these key areas:
   - SMS send failures
   - Rate limiting events (429 responses)
   - Authentication errors (401)
   - Timeout errors

### Key Metrics to Monitor

- **Send Success Rate:** Should be >95% for configured credentials
- **Average Response Time:** Should be <5 seconds
- **Error Rate:** Monitor for spikes
- **Rate Limit Hits:** Monitor 429 responses
- **API Credit Usage:** Track against VarTech quota

### Sample Monitoring Setup

```typescript
// Log SMS activity
console.log(`[SMS] Sent to ${to}`)
console.log(`[SMS] Message ID: ${messageId}`)
console.log(`[SMS] Duration: ${duration}ms`)

// Track errors
console.error(`[SMS] Failed: ${error.message}`)
console.error(`[SMS] Status: ${statusCode}`)

// Monitor rate limiting
if (response.status === 429) {
  console.warn(`[SMS] Rate limited. Retry after: ${retryAfter}s`)
}
```

## Rollback Plan

If issues occur after deployment:

### Immediate Actions

1. **Disable Demo Mode if Accidentally Enabled**
   ```bash
   unset SMS_DEMO_MODE
   # or set to false
   SMS_DEMO_MODE=false
   ```

2. **Check Environment Variables**
   ```bash
   # Verify credentials are set
   echo $VARTECH_API_KEY
   echo $VARTECH_BASE_URL
   ```

3. **Check VarTech Service Status**
   - Visit https://sms.thevartech.com
   - Verify API is operational

### Rollback Steps

If critical issues are identified:

```bash
# Option 1: Redeploy previous version (if using git)
git revert <commit-hash>
git push origin main

# Option 2: Redeploy from main branch (if issue is on separate branch)
git checkout main
git push origin main
```

### Verification After Rollback

```bash
# Verify previous version is running
curl https://your-domain.com/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{"to":"+234810000000","message":"Rollback test"}'
```

## Troubleshooting Deployment Issues

### Issue: "SMS service not configured"

**Solution:**
- Verify `VARTECH_API_KEY` is set in environment
- Verify `VARTECH_BASE_URL` is set correctly
- Restart the application/server

### Issue: "401 Unauthorized"

**Solution:**
- Check `VARTECH_API_KEY` is correct
- Verify API key is active in VarTech account
- Check for expired credentials

### Issue: "Connection timeout"

**Solution:**
- Verify network connectivity to VarTech API
- Check firewall rules if applicable
- Increase `timeout` setting if needed
- Contact VarTech support

### Issue: "Rate limit exceeded (429)"

**Solution:**
- Normal operation - implement exponential backoff
- Check `Retry-After` header for wait time
- Monitor usage against VarTech quota
- Contact VarTech for quota increase if needed

### Issue: High error rate

**Solution:**
- Check phone number formatting
- Verify message content (length, characters)
- Check API key quota/credits
- Review VarTech API status
- Enable logging to diagnose specific failures

## Performance Optimization

### Recommended Settings

```typescript
// lib/sms-gateways/vartech-gateway.ts
const settings = {
  timeout: 30000,        // 30 second timeout
  retryAttempts: 3,      // 3 retry attempts
  retryDelayMs: 1000     // 1 second base delay
}
```

### Optimization Tips

1. **Batch Processing:**
   ```typescript
   // Add delay between batch sends
   for (const recipient of recipients) {
     await sendSMS(recipient)
     await new Promise(r => setTimeout(r, 100))
   }
   ```

2. **Connection Pooling:**
   - Consider connection pooling for high-volume scenarios
   - Implement queue system for SMS sending

3. **Caching:**
   - Cache phone numbers if frequently accessed
   - Cache template messages

## Security Best Practices

### Environment Variables

- ✅ Store `VARTECH_API_KEY` securely (never in code)
- ✅ Use different keys for staging and production
- ✅ Rotate API keys periodically
- ✅ Use secrets management system

### Input Validation

- ✅ Validate phone numbers before sending
- ✅ Validate message length
- ✅ Sanitize sender names
- ✅ Rate limit per IP/user

### Logging

- ✅ Never log full API keys
- ✅ Never log sensitive customer data
- ✅ Log only necessary info for debugging
- ✅ Use secure logging service

## Monitoring Template

Create a monitoring dashboard tracking:

```
SMS Gateway Metrics:
├── Total SMS Sent (daily)
├── Send Success Rate (%)
├── Send Failure Rate (%)
├── Average Response Time (ms)
├── Rate Limit Events (count)
├── API Errors by Type
│   ├── 401 Unauthorized
│   ├── 429 Rate Limited
│   ├── 500 Server Error
│   └── Network Timeouts
├── API Credit Usage
└── Top Error Messages
```

## Documentation for Team

Share with your team:
- [ ] `docs/QUICK_START.md` - For quick setup
- [ ] `docs/SMS_API_INTEGRATION.md` - For API reference
- [ ] `docs/PAYLOAD_STRUCTURE.md` - For payload details
- [ ] `examples/sms-api-usage.ts` - For code examples
- [ ] This deployment guide - For deployment procedures

## Post-Deployment Maintenance

### Weekly Checks
- [ ] Monitor SMS delivery rates
- [ ] Check for error spikes
- [ ] Review API quota usage
- [ ] Check logs for issues

### Monthly Tasks
- [ ] Review performance metrics
- [ ] Update documentation if needed
- [ ] Check for VarTech API updates
- [ ] Review security settings

### Quarterly Tasks
- [ ] Rotate API credentials
- [ ] Review and optimize retry logic
- [ ] Test disaster recovery
- [ ] Update dependencies

## Support Contacts

- **VarTech Support:** support@thevartech.com
- **VarTech Docs:** https://sms.thevartech.com/api-doc
- **Team Lead:** [Your contact info]
- **On-Call Engineer:** [On-call contact]

## Deployment Checklist

Final checklist before going live:

### Code Quality
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Code reviewed by team member
- [ ] Changes tested locally

### Testing
- [ ] Demo mode testing complete
- [ ] Production credentials tested
- [ ] Error scenarios tested
- [ ] Rate limiting tested

### Configuration
- [ ] Environment variables set
- [ ] API credentials verified
- [ ] Monitoring configured
- [ ] Logging enabled

### Documentation
- [ ] Team notified of changes
- [ ] Documentation updated
- [ ] Runbooks prepared
- [ ] Rollback plan reviewed

### Deployment
- [ ] Build successful
- [ ] Tests passing
- [ ] No conflicts in deployment
- [ ] Verified in staging (if applicable)

### Post-Deployment
- [ ] Service responding correctly
- [ ] Metrics being collected
- [ ] Alerts configured
- [ ] Team notified of go-live

## Success Criteria

Deployment is successful when:

✅ SMS sending works without errors  
✅ Response time is acceptable (<5s)  
✅ Error rate is low (<5%)  
✅ Rate limiting works correctly  
✅ Logging is capturing events  
✅ Monitoring is functional  
✅ No production incidents  

---

**Deployment Status:** Ready for Production  
**Last Updated:** 2024  
**Next Review:** After 1 week of production operation
