# VarTech SMS API 500 Error - Fix Summary

## The Error You're Seeing

```
[VarTech] SMS send failed: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This happens because the external API is returning an **HTML error page** (typically a 500 error), and your code tries to parse it as JSON without checking the `Content-Type` header first.

---

## Root Cause

**File:** `lib/sms-gateways/vartech-gateway.ts`  
**Line 45 (old code):**
```typescript
const data = await response.json()  // ❌ Fails if response is HTML
```

When the VarTech API returns HTML instead of JSON, `response.json()` throws:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This error bubbles up and gets caught by a generic catch block, hiding the real problem.

---

## What Was Fixed

### Change 1: Validate Content-Type Before Parsing JSON

**Before:**
```typescript
const data = await response.json()
```

**After:**
```typescript
const contentType = response.headers.get("content-type") || ""
const isJsonResponse = contentType.includes("application/json")

if (isJsonResponse) {
  try {
    data = await response.json()
  } catch (parseError) {
    responseText = await response.text()
    throw new Error(`Failed to parse JSON response: ${parseError.message}`)
  }
} else {
  responseText = await response.text()
  console.error(
    `API returned non-JSON response (Content-Type: ${contentType}). Status: ${response.status}. Raw response: ${responseText.substring(0, 500)}`
  )
  // Handle the error appropriately...
}
```

### Change 2: Log Actual Response Body

**Before:**
- Silent failure when JSON parsing failed
- No visibility into what the API actually returned

**After:**
```
[VarTech] API returned non-JSON response (Content-Type: text/html). Status: 500. 
Raw response (first 500 chars): <!DOCTYPE html><html>
<head><title>500 Internal Server Error</title></head>
...
```

### Change 3: Detailed Request/Response Logging

Now logs at every step:
```
[VarTech] Attempt 1/3: Sending to 2348123456789
[VarTech] Request URL: https://sms.thevartech.com/api/send
[VarTech] Response status: 500 Internal Server Error
[VarTech] Response headers: Content-Type: text/html
```

---

## Why the API Returns HTML Instead of JSON

### Common Reasons:

1. **API Server Error (500/502/503)**
   - The API server is experiencing internal issues
   - Returns a generic HTML error page instead of JSON error response

2. **Invalid Authentication**
   - API key is missing, expired, or invalid
   - Server returns 401 Unauthorized as HTML

3. **Wrong Endpoint**
   - URL is incorrect or the endpoint has moved
   - Server returns 404 Not Found as HTML

4. **Request Format Error**
   - Field names don't match API expectations
   - Phone number format is incorrect
   - Missing required headers

5. **Server Configuration**
   - Firewall/IP whitelist blocks your request
   - Rate limiting returns HTML 429 response
   - CORS headers missing

---

## How to Find the Real Problem Now

With the updated code, you'll see detailed logs. Look for:

### Scenario 1: Server Error
```
[VarTech] Response status: 500 Internal Server Error
[VarTech] Response headers: Content-Type: text/html
[VarTech] Raw response: <!DOCTYPE html>...<h1>500 Internal Server Error</h1>...
```
**Action:** Contact VarTech support or check their API status

### Scenario 2: Authentication Error
```
[VarTech] Response status: 401 Unauthorized
[VarTech] Raw response: <!DOCTYPE html>...<h1>401 Unauthorized</h1>...
```
**Action:** Verify your API key in environment variables

### Scenario 3: Wrong Endpoint
```
[VarTech] Response status: 404 Not Found
[VarTech] Raw response: <!DOCTYPE html>...<h1>404 Not Found</h1>...
```
**Action:** Check VARTECH_BASE_URL environment variable

### Scenario 4: Success
```
[VarTech] Response status: 200 OK
[VarTech] Response headers: Content-Type: application/json
[VarTech] Parsed JSON response: { success: true, message_id: "..." }
```

---

## Verification Checklist

- [ ] Environment variables are set: `VARTECH_API_KEY`, `VARTECH_BASE_URL`, `VARTECH_SENDER_ID`
- [ ] API key is valid and not expired
- [ ] Base URL matches VarTech's documentation
- [ ] Phone numbers include country code (e.g., 234 for Nigeria)
- [ ] Sender ID is alphanumeric and ≤ 11 characters
- [ ] No firewall blocks outbound HTTPS to sms.thevartech.com

---

## Files Modified

- **`lib/sms-gateways/vartech-gateway.ts`** - Added robust error handling and detailed logging

## Testing

1. **Check logs** when calling the SMS endpoint
2. **Look for the raw response** from the API in the error logs
3. **Use cURL** to test the endpoint directly:

```bash
curl -v -X POST https://sms.thevartech.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VARTECH_API_KEY" \
  -d '{
    "recipient": "2348123456789",
    "sender_id": "AlertMe",
    "message": "Test"
  }'
```

4. **Compare** the API response you see in logs vs. what cURL returns

This will reveal exactly what's causing the 500 error.
