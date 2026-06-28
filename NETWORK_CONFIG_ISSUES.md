# Network & Server Configuration Issues That Cause HTML Error Responses

When an API returns HTML instead of JSON, it's typically one of these infrastructure issues:

---

## 1. **API Server Error (500/502/503)**

### What You'll See
```
HTTP Status: 500 Internal Server Error
Content-Type: text/html
Response: <!DOCTYPE html>
  <h1>500 Internal Server Error</h1>
  <p>The server encountered an unexpected condition...</p>
```

### Common Causes
- VarTech API server is down or overloaded
- Database connection issues on VarTech's backend
- Memory leak or resource exhaustion
- Code deployment with bugs
- Unhandled exception in VarTech's code

### How to Fix
1. Check VarTech's status page or Twitter for known issues
2. Wait a few minutes (may be temporary)
3. The code now retries 3 times automatically
4. Contact VarTech support if persistent

### Test
```bash
curl -i https://sms.thevartech.com/api/send
# If you get HTML with 500 status, their server is having issues
```

---

## 2. **Firewall/IP Whitelist Blocking**

### What You'll See
```
HTTP Status: 403 Forbidden
Content-Type: text/html
Response: <!DOCTYPE html>
  <h1>403 Forbidden</h1>
  <p>Access denied</p>
```

### Common Causes
- Your server's IP is not whitelisted with VarTech
- VarTech has geo-blocking enabled
- Request from a cloud provider IP that's blacklisted
- VarTech's WAF (Web Application Firewall) is blocking your requests

### How to Fix
1. Check VarTech's dashboard for IP whitelist settings
2. Add your server's outbound IP to the whitelist
3. If using Vercel, find your deployment's egress IP
4. Contact VarTech support to check if they have geo-blocking

### Test
```bash
# Find your outbound IP
curl https://api.ipify.org?format=json

# Then verify it in VarTech's dashboard
# Or test from your actual server:
curl -v https://sms.thevartech.com/api/send
# Check if you get 403 Forbidden
```

---

## 3. **Invalid or Expired Authentication**

### What You'll See
```
HTTP Status: 401 Unauthorized
Content-Type: text/html
Response: <!DOCTYPE html>
  <h1>401 Unauthorized</h1>
```

### Common Causes
- API key is invalid or malformed
- API key has expired
- API key was regenerated and old key still in use
- Bearer token format is wrong (e.g., extra space)
- API key is missing entirely (empty string)

### How to Fix
1. Verify `VARTECH_API_KEY` environment variable is set:
   ```bash
   echo $VARTECH_API_KEY
   # Should output a long string, NOT empty
   ```

2. Check for whitespace/formatting issues:
   ```bash
   # Make sure there are no extra quotes or newlines
   wc -c <<< "$VARTECH_API_KEY"
   # Should be your key length + 1 (the newline)
   ```

3. Regenerate the API key in VarTech's dashboard
4. Update the environment variable

### Test
```bash
curl -v -X POST https://sms.thevartech.com/api/send \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"

# If you get 401 HTML response, your key is invalid
# If you get 400/422 JSON response, the key is valid but request format is wrong
```

---

## 4. **Wrong Content-Type or Request Format**

### What You'll See
```
HTTP Status: 415 Unsupported Media Type
Content-Type: text/html
Response: <!DOCTYPE html>
  <h1>415 Unsupported Media Type</h1>
```

OR

```
HTTP Status: 400 Bad Request
Content-Type: text/html (sometimes)
```

### Common Causes
- Missing or wrong `Content-Type: application/json` header
- Request body is not valid JSON
- Field names don't match API expectations (e.g., "to" vs "recipient")
- Phone number format is incorrect
- Required fields are missing

### How to Fix
1. Verify headers are correct:
   ```
   Content-Type: application/json
   Authorization: Bearer YOUR_KEY
   ```

2. Verify JSON body structure matches VarTech's docs:
   ```json
   {
     "recipient": "2348123456789",    // Phone with country code
     "sender_id": "AlertMe",          // Max 11 chars, alphanumeric
     "message": "Your SMS text"       // The message content
   }
   ```

3. Check phone number format:
   ```
   ✅ Correct: 2348123456789 (country code + number)
   ✅ Correct: +2348123456789
   ❌ Wrong: 08123456789 (missing country code)
   ❌ Wrong: +234-81-2345-6789 (extra formatting)
   ```

### Test
```bash
# Test with correct format
curl -X POST https://sms.thevartech.com/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{
    "recipient": "2348123456789",
    "sender_id": "AlertMe",
    "message": "Test"
  }'

# You should get JSON response (not HTML)
```

---

## 5. **Wrong Endpoint or URL**

### What You'll See
```
HTTP Status: 404 Not Found
Content-Type: text/html
Response: <!DOCTYPE html>
  <h1>404 Not Found</h1>
```

### Common Causes
- VARTECH_BASE_URL is incorrect
- Endpoint path is wrong
- API docs point to old/deprecated endpoint
- Domain is wrong or DNS doesn't resolve

### How to Fix
1. Check your environment variable:
   ```bash
   echo $VARTECH_BASE_URL
   # Should output: https://sms.thevartech.com/api (or similar)
   ```

2. Verify the endpoint in VarTech's current docs
3. Test the URL directly:
   ```bash
   curl https://sms.thevartech.com/api/send -v
   # Should get some response (not 404 at root unless endpoint is truly wrong)
   ```

### Test
```bash
# Verify the base URL resolves
nslookup sms.thevartech.com

# Test if endpoint exists
curl -X POST https://sms.thevartech.com/api/send \
  -H "Content-Type: application/json"
```

---

## 6. **Rate Limiting**

### What You'll See
```
HTTP Status: 429 Too Many Requests
Content-Type: text/html (sometimes)
Response: <!DOCTYPE html>
  <h1>429 Too Many Requests</h1>
```

### Common Causes
- Your application is making too many requests
- Rate limit was exceeded in previous requests
- Rate limit hasn't reset yet
- VarTech has strict per-IP limits

### How to Fix
1. Check if rate limit has been exceeded in logs
2. Wait for the rate limit to reset
3. Check VarTech's docs for rate limits:
   - Requests per minute?
   - Requests per hour?
   - Requests per day?

4. Implement exponential backoff (already done in the code)

### Test
```bash
# Make many requests in quick succession
for i in {1..100}; do
  curl -X POST https://sms.thevartech.com/api/send \
    -H "Authorization: Bearer YOUR_KEY" \
    -H "Content-Type: application/json"
done

# Look for a 429 response
```

---

## 7. **DNS Resolution Failure**

### What You'll See
```
curl: (6) Could not resolve host: sms.thevartech.com
```

OR

```
HTTP Status: 503 Service Unavailable
Content-Type: text/html
```

### Common Causes
- DNS server is down
- Domain name is wrong
- Network connectivity issue
- ISP DNS is blocking the domain
- Vercel's DNS resolver has issues

### How to Fix
1. Test DNS resolution:
   ```bash
   nslookup sms.thevartech.com
   dig sms.thevartech.com
   ```

2. Try alternate DNS:
   ```bash
   # Use Google's DNS
   nslookup sms.thevartech.com 8.8.8.8
   ```

3. Check network connectivity:
   ```bash
   ping sms.thevartech.com
   ```

---

## 8. **SSL/TLS Certificate Issues**

### What You'll See
```
curl: (60) SSL certificate problem
```

OR gets redirected to error page

### Common Causes
- VarTech's SSL certificate expired
- Self-signed certificate not trusted
- Certificate doesn't match domain
- Man-in-the-middle attack (unlikely but possible)

### How to Fix
```bash
# Check the SSL certificate
openssl s_client -connect sms.thevartech.com:443

# Verify the certificate is valid and matches the domain
# If expired, VarTech needs to renew it
```

---

## Quick Diagnostic Flowchart

```
API returns HTML instead of JSON?
│
├─ Status 500/502/503?
│  └─> VarTech server is down → Wait or contact support
│
├─ Status 401?
│  └─> Authentication failed → Check API key
│
├─ Status 403?
│  └─> Access denied → Check IP whitelist
│
├─ Status 404?
│  └─> Endpoint not found → Check URL
│
├─ Status 415?
│  └─> Wrong content type → Check headers
│
├─ Status 429?
│  └─> Rate limited → Wait for reset
│
└─ Status 200 but HTML body?
   └─> API returned HTML as body → Contact VarTech
```

---

## How to Collect Diagnostic Info for VarTech Support

When contacting VarTech, include:

1. **The exact API call that's failing:**
   ```bash
   curl -v -X POST https://sms.thevartech.com/api/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [REDACTED]" \
     -d '{"recipient":"2348123456789","sender_id":"AlertMe","message":"test"}'
   ```

2. **The full response** (status, headers, body):
   ```
   HTTP/2 500
   content-type: text/html
   
   <!DOCTYPE html>
   ...
   ```

3. **When it started happening**
4. **How often it happens** (always? intermittent?)
5. **Your server's outbound IP address** (from `curl https://api.ipify.org`)

This helps VarTech debug on their end.
