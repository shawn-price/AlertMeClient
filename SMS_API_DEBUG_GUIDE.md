# SMS API 500 Error Debug Guide

## The Problem

**Error:** `[VarTech] SMS send failed: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

This error occurs when the SMS API returns an HTML error page instead of JSON. This typically indicates:
- The API endpoint is misconfigured or redirecting
- The API server is experiencing internal errors (500, 502, 503)
- Authentication headers are invalid or missing
- The request format doesn't match the API's expectations

---

## Root Cause Analysis

### What Changed in the Fix

The original code on **line 45** of `vartech-gateway.ts` had a critical flaw:

```typescript
// ❌ BEFORE: Blindly parses as JSON
const data = await response.json()
```

This fails silently when the response is HTML because `response.json()` throws a JSON parse error that wasn't being handled properly.

### What We Fixed

The updated code now:
1. **Checks Content-Type header** before attempting JSON parsing
2. **Reads raw response text** when Content-Type is not JSON
3. **Logs the actual HTML error** so you can see what the API returned
4. **Distinguishes between network errors and API errors**
5. **Implements smart retry logic** only for 5xx errors

---

## How to Debug Using the Logs

### Step 1: Enable Debug Logs

The updated code now includes detailed logging. Check your server logs for patterns like:

```
[VarTech] Attempt 1/3: Sending to 2348123456789
[VarTech] Request URL: https://sms.thevartech.com/api/send
[VarTech] Request headers: Content-Type: application/json, Authorization: Bearer [REDACTED]
[VarTech] Response status: 500 Internal Server Error
[VarTech] Response headers: Content-Type: text/html
[VarTech] API returned non-JSON response (Content-Type: text/html). Status: 500. Raw response (first 500 chars): <!DOCTYPE html>...
```

### Step 2: Check These Configuration Issues

#### A. Authentication Token
```bash
# Verify your environment variables are set correctly
echo $VARTECH_API_KEY
echo $VARTECH_BASE_URL
echo $VARTECH_SENDER_ID
```

**Common issues:**
- Token is empty or undefined
- Token has extra whitespace or quotes
- Token has expired or been revoked
- Bearer prefix is being added twice (check the code)

#### B. Endpoint URL
```bash
# Test the endpoint with curl to see what the API actually returns
curl -v -X POST https://sms.thevartech.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "recipient": "2348123456789",
    "sender_id": "AlertMe",
    "message": "Test message"
  }'
```

**Expected response:** JSON with success and message_id
**Actual problem:** HTML 500 error page

#### C. Request Format
The VarTech API expects:
```json
{
  "recipient": "2348123456789",        // Phone number with country code
  "sender_id": "AlertMe",              // Your sender ID (max 11 chars)
  "message": "Your SMS text"           // The message content
}
```

**Common mistakes:**
- Wrong field names (e.g., `to` instead of `recipient`)
- Phone number not formatted with country code
- Sender ID contains invalid characters or is too long

---

## Network & Server Configuration Issues That Cause HTML Responses

### 1. **Wrong Endpoint** (404 → HTML error page)
**Symptom:** Consistently getting HTML errors
**Solution:** Verify the exact endpoint from VarTech's API docs
```typescript
// Check if your baseUrl is correct
console.log(process.env.VARTECH_BASE_URL) // Should be https://sms.thevartech.com/api
```

### 2. **API Server Down** (500/502/503)
**Symptom:** Server returns `<!DOCTYPE html>...<h1>503 Service Unavailable</h1>`
**Solution:** This is a server-side issue. The retry logic in the updated code will attempt 3 times with exponential backoff.

### 3. **Invalid or Expired Authentication**
**Symptom:** Server returns HTML 401/403 error page
**Solution:** Regenerate your API key in VarTech's dashboard
```typescript
// Verify the API key is being sent
console.log(`Auth header: Bearer ${process.env.VARTECH_API_KEY?.substring(0, 10)}...`)
```

### 4. **CORS or Request Filtering Issues**
**Symptom:** API returns 403 Forbidden as HTML
**Solution:** Check if:
- Your server's IP is whitelisted with VarTech
- Request headers match what VarTech expects
- VarTech is blocking requests from specific origins

### 5. **Connection Issues**
**Symptom:** Timeout errors, network timeouts
**Solution:** The code retries automatically. Check:
- Firewall rules blocking outbound HTTPS to `sms.thevartech.com`
- Network latency (default timeout is 30 seconds)

---

## Step-by-Step Debugging Workflow

### Phase 1: Verify Configuration
```bash
# 1. Check all required env vars are set
env | grep VARTECH

# 2. Check they're not empty
[ -z "$VARTECH_API_KEY" ] && echo "VARTECH_API_KEY is NOT set" || echo "VARTECH_API_KEY is set"
```

### Phase 2: Test with cURL
```bash
# Make the exact same request your code makes
curl -v -X POST \
  "https://sms.thevartech.com/api/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VARTECH_API_KEY" \
  -d '{
    "recipient": "2348123456789",
    "sender_id": "AlertMe",
    "message": "Test SMS"
  }'

# Look for:
# - HTTP status code (should be 2xx, not 5xx)
# - Content-Type header (should include application/json)
# - Response body (should be JSON, not HTML)
```

### Phase 3: Check Application Logs
Look for these log patterns in your deployment logs:

**✅ Success:**
```
[VarTech] Attempt 1/3: Sending to 2348123456789
[VarTech] Response status: 200 OK
[VarTech] Response headers: Content-Type: application/json
[VarTech] Parsed JSON response: { success: true, message_id: "..." }
[VarTech] Success response: messageId = ...
```

**❌ API Error:**
```
[VarTech] Response status: 500 Internal Server Error
[VarTech] Response headers: Content-Type: text/html
[VarTech] API returned non-JSON response. Raw response: <!DOCTYPE html>...
[VarTech] Retrying after 1000ms due to server error
```

**❌ Auth Error:**
```
[VarTech] Response status: 401 Unauthorized
[VarTech] API returned non-JSON response (Content-Type: text/html)
```

### Phase 4: Contact VarTech Support
If all configuration is correct but you're still getting HTML errors:
1. Collect the full raw response (now available in logs)
2. Include your test cURL command and its output
3. Include your API key (if you don't mind regenerating it)
4. Ask about: rate limits, IP whitelisting, account status

---

## Key Changes Made

### Before
```typescript
const data = await response.json() // ❌ Throws if not JSON
```

### After
```typescript
// ✅ Check content-type first
const contentType = response.headers.get("content-type") || ""
const isJsonResponse = contentType.includes("application/json")

if (isJsonResponse) {
  data = await response.json()
} else {
  responseText = await response.text()
  console.error(`API returned ${contentType}: ${responseText.substring(0, 500)}`)
}
```

---

## Testing the Fix

### Test in Demo Mode (No API Needed)
```bash
# Set this to bypass the actual API call
export SMS_DEMO_MODE=true
```

### Test with Real API
1. Make a POST request to your route:
```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+2348123456789",
    "message": "Test message"
  }'
```

2. Check the server logs for the detailed debug output
3. The response will either show success or include the raw error from VarTech

---

## Summary of Fixes

| Issue | Solution |
|-------|----------|
| Blindly parsing non-JSON responses | Check Content-Type header before `response.json()` |
| No visibility into actual API errors | Log raw response text when HTML is returned |
| Silent failures in error handling | Detailed console logs at every step |
| No distinction between error types | Separate handling for network vs API errors |
| Missing auth validation | Log request headers and auth token (redacted) |
| No retry strategy | Smart retry logic for 5xx errors only |

The updated code will now provide clear diagnostics so you can identify exactly what's going wrong with the VarTech API integration.
