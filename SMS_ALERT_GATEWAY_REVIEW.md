# SMS alerts and SMS gateway review

**Review date:** 1 November 2026  
**Scope:** Static review of the checked-out client, Next.js API routes, gateway implementation, UI, tests and configuration. No credentials were inspected and no real SMS was sent. Existing project documents were treated as claims to verify against code, not proof of deployment or delivery.

## Executive assessment

**Overall: prototype-level; not ready for production financial alerts.** The repository contains a VarTech HTTP adapter, alert templates, settings UI, manual message and business-card screens, and a delivery-webhook receiver. However, the live delivery contract is unverified; the settings screen does not control the sending routes; transfer alerts can be duplicated, misaddressed or contain incorrect information; delivery status is not reconciled; and exposed endpoints present serious security and cost risks.

The most urgent problem is that `GET /api/settings/vartech-config` returns the actual server API key without authentication in the route. The SMS send and test routes also have no authentication or authorization checks in the inspected handlers, and the gateway-configured route can direct a server-side HTTP request to a caller-provided base URL. Restrict access at the deployment edge immediately if exposed, disable SMS endpoints until protected, and rotate any credential that may have been exposed. Whether a deployment already has separate external protection cannot be determined from this repository alone.

## Feature inventory

| Feature | What code currently does | Assessment |
|---|---|---|
| Transaction debit alerts | `dataStore.addTransaction` generates a debit SMS for the local user's phone; the success screen generates another independently. | Implemented on client-driven transfer paths, but duplicate and accuracy risks are high. |
| Recipient credit alerts | The store looks up a beneficiary by exact name and sends if a phone is present; the success screen independently uses `transferData.phone`. | Conditional, inconsistent, and can duplicate; no confirmed recipient-side balance source. |
| Balance and low-balance alerts | Templates and generator functions exist. | No automatic balance inquiry/low-balance trigger found in the reviewed code. |
| Bank and wallet templates | Four types per listed bank/wallet are built from a mapping, with a generic fallback. | Coverage does not mean each bank has a distinct template or that every flow uses it. |
| Template composer | Create/edit/delete, preview, set default and browser-side persistence. | Separate from the automatic SMS service; edits/default selection do not control transaction alert rendering. |
| Custom message | Composer sends a user-entered message to a saved beneficiary via `/api/sms/send`. | Implemented; inherits API security and delivery limitations. |
| Business card | Composer calls `/api/sms/business-card`. | Message includes bank, email and phone, but the API ignores submitted sender name and account number. Demo mode is not implemented on this route. |
| Verification SMS | A helper formats a verification code. | A message-sending helper only; no OTP creation, expiry, verification, or abuse protection demonstrated by it. `/api/sms/verify` checks gateway connectivity, not an OTP. |
| Receipt share via SMS | Opens a device `sms:` link. | Device messaging flow, separate from VarTech and server-side delivery tracking. |
| Delivery webhook and metrics | Accepts JSON/form callbacks, appends raw events to a local JSONL file, increments counters. | Unauthenticated, not reconciled to outgoing messages, not durable across typical distributed/serverless environments. |
| Multi-gateway fallback | Manager sorts enabled configurations by priority and records attempts. | Only VarTech is implemented; default client configurations list different, disabled providers. No functional multi-provider fallback. |

Evidence: `lib/data-store.ts:764-861`, `components/transaction-success.tsx:22-75`, `lib/alert-templates.ts:318-360`, `components/sms-template-composer.tsx:57-88,126-152,282-365`, `app/api/sms/business-card/route.ts:25-82`, `lib/production-alerts.ts:212-230`, `lib/share-receipt.ts:91-97`, `lib/sms-gateways/gateway-manager.ts:14-23,28-80`.

## How sending currently works

1. The ordinary browser client sends `{to, message, type}` to `POST /api/sms/send`. If `SMS_DEMO_MODE=true`, that route returns a synthetic ID and success without sending. Otherwise it reads `VARTECH_API_KEY`, `VARTECH_BASE_URL` (default `https://sms.thevartech.com/api`) and `VARTECH_SENDER_ID` (default `AlertMe`), constructs a VarTech adapter, and submits the message.
2. The adapter strips non-digits, converts a leading Nigerian `0` to `234`, and prefixes `234` to any number not already beginning with that code. It POSTs JSON `{recipient, sender_id, message}` to `<baseUrl>/send` using bearer authentication. It interprets an HTTP OK response with truthy `data.success` as success; if no provider ID is returned it fabricates one. Defaults are 30-second timeout and three total attempts with linear delays for selected errors.
3. A separate `POST /api/sms/send-with-gateways` accepts complete gateway configurations from the caller. The manager sorts by priority, but instantiates only VarTech. The hook sends client-side configurations to this route. New default state contains only disabled legacy providers, not VarTech.
4. A callback to `POST /api/sms/webhook` is recorded as an event and counted, but is not matched to a stored outgoing message or used to update the transfer UI.

Evidence: `app/api/sms/send/route.ts:5-109`, `lib/sms-gateways/base-gateway.ts:16-58`, `lib/sms-gateways/vartech-gateway.ts:11-105`, `app/api/sms/send-with-gateways/route.ts:8-42`, `hooks/use-sms-alert.ts:43-95`, `lib/data-store.ts:566-606`, `app/api/sms/webhook/route.ts:36-70`.

**Provider verification:** The repository asserts a VarTech API shape, but this review did not validate the `/send` or `/status` contract, authentication, accepted response fields, sender-ID restrictions, callbacks, account balance, coverage, or delivery against VarTech. A 2xx/`success` response should be treated as provider acceptance until a verified delivery receipt arrives, not as proof of handset delivery.

## Detailed findings, ordered by priority

### P0 — API key exposed and configuration not protected

`GET /api/settings/vartech-config` returns `apiKey` both from the in-memory store and, by default, from the server environment. The route contains no authentication or role check; a password input only conceals the value visually, not from the browser or an HTTP caller. `POST` also lacks authorization and stores the supplied key in process memory. The UI fetches this key on mount. If exposed without external protection, the gateway account and its balance can be compromised.

**Evidence:** `app/api/settings/vartech-config/route.ts:13-39,49-77`; `components/vartech-sms-settings.tsx:37-46,205-217`.

**Action:** Block access, rotate potentially exposed keys, authenticate and authorize administrative operations, store secrets server-side in a secret manager, and return only a masked indicator. Audit provider usage and logs for misuse.

### P0 — Unauthenticated sending and server-side request forgery risk

`/api/sms/send`, `/api/sms/business-card` and `/api/sms/test` can invoke the environment-configured paid gateway without route-level authentication; `/api/sms/test` has no rate limiter. The general send route accepts arbitrary destination and content. `/api/sms/send-with-gateways` has neither authentication nor rate limiting and accepts `gatewayConfigs` including `credentials.baseUrl`, which is used as a server-side fetch destination. This creates an SSRF primitive, subject to network and platform controls, and can also be used for sending through caller-supplied credentials. The GET test suite can trigger a real send when demo mode is off.

The in-memory IP bucket used by some routes is not a substitute for authentication: it is process-local, resets on restart, and uses forwarded headers whose trust depends on proxy configuration. Default capacity is 70 initial tokens with refill of 60/minute; several endpoints bypass it entirely.

**Evidence:** `app/api/sms/send/route.ts:5-18,87-100`; `app/api/sms/test/route.ts:8-48`; `app/api/sms/send-with-gateways/route.ts:8-40`; `lib/sms-gateways/vartech-gateway.ts:14,25-45`; `lib/rate-limiter.ts:6-9,15-50`; `app/api/sms/test-suite/route.ts:16-32,194-205`.

**Action:** Remove caller-controlled provider URLs and credentials; use a server-side provider allowlist and restrict egress. Require authenticated authorization and CSRF/origin protections as appropriate, enforce distributed per-user/account/destination quotas and spend limits, and restrict or disable test endpoints in production. Never send a paid message as a side effect of a public GET.

### P1 — Gateway settings are disconnected from actual sends

The settings UI reads and writes a process-local `configStore`; the main send, business-card, and gateway-test endpoints instead read environment variables directly and never read that store. Therefore save, enable/disable, timeout, retry and sender-ID changes in the settings UI do not control those routes. The transfer hook uses a third, browser-side config list, whose defaults have no VarTech entry. In a fresh state it reports no enabled gateway; enabling a legacy provider alone would not work because the manager silently skips unimplemented names. Config changes are lost on process restart and can differ between instances. `VARTECH_ENABLED` is displayed by settings but is not enforced by the send route.

**Evidence:** `app/api/settings/vartech-config/route.ts:13-15,28-36,54-77`; `app/api/sms/send/route.ts:31-40,87-92`; `app/api/sms/test/route.ts:18-40`; `lib/data-store.ts:566-606`; `hooks/use-sms-alert.ts:43-66`; `lib/sms-gateways/gateway-manager.ts:14-23,40-42`.

**Action:** Establish one authorized server-side source of truth for enabled state, secrets and operational parameters, shared by every send and test path. Remove unsupported providers or implement and test real adapters before advertising fallback.

### P1 — Duplicate sends and preference bypass

A transfer through the processing screen first calls `addTransaction`, which awaits its own SMS work, despite the comment claiming immediate navigation. The processing screen then starts another send through the gateway hook; on navigation, the success screen independently sends debit and possibly credit messages again. The latter two paths do not check `settings.smsAlerts`. The success-screen effect can run again on remount or changed props; no event-level idempotency is present. Duplicates are conditional on which paths are configured and succeed, but are possible and can incur cost or confuse recipients.

**Evidence:** `components/transfer-processing-screen.tsx:59-106`; `lib/data-store.ts:801-849`; `components/transaction-success.tsx:22-47,49-68`; `lib/production-alerts.ts:74-106`.

**Action:** Emit exactly one authoritative transaction event, create one intended notification per recipient and type, honor preferences centrally, and use durable idempotency keys across rendering, retry and gateway operations. Decouple transaction completion from SMS with an outbox and worker.

### P1 — Wrong recipient, wrong balances and unreliable template substitution

- The dynamic path passes the transaction's `recipient` name as the destination phone. The adapter strips non-digits and prefixes `234`, so a name can become `234` or an otherwise invalid destination. This path also selects a debit template by recipient bank and always labels the send `debit`.
- The standard recipient credit alert supplies `0` as the unknown beneficiary balance. The success-screen service uses the sender's `payload.balance` in the recipient credit message. Either can misrepresent a recipient's balance and the latter can disclose sender information. Omit unknown balances; do not infer them.
- The processing-screen message subtracts the amount from `userData.balance` after `addTransaction` has already debited amount and fee. If that extra path sends, its balance is too low. The success screen also passes `data.bank` as both sender and recipient bank.
- The dynamic template replacement does not supply the `{recipient}` used by the default bank debit templates. Its fallback searches for `id === "debit_alert"`, while generated IDs are bank-specific, so an unmatched bank normally fails instead of using the documented fallback.
- `getBankTemplates` uses exact, case-sensitive keys; the default `"ECOBANK"` and values such as `"Ecobank"` do not match `"Ecobank Nigeria"` and fall back to generic text. Template composer edits are stored independently, while the dynamic service regenerates defaults.

**Evidence:** `lib/data-store.ts:792-845`; `lib/sms-service.ts:113-158,167-172,275-287`; `lib/sms-gateways/base-gateway.ts:46-57`; `lib/production-alerts.ts:53-72`; `components/transfer-processing-screen.tsx:85-100`; `components/transaction-success.tsx:54-65`; `lib/alert-templates.ts:36-40,318-344`; `components/sms-template-composer.tsx:126-152`.

**Action:** Model sender/recipient identities, verified phone numbers, bank identifiers, transaction reference and balances explicitly. Render using a validated versioned template and reject unresolved variables. Test exact rendered messages and ensure unknown data is omitted.

### P1 — Delivery reporting is neither trusted nor durable

The webhook accepts unverified arbitrary payloads, stores raw data, and acknowledges success even when file persistence fails. Events are written to `data/twilio-webhooks.jsonl` despite being labeled VarTech; local file writes are not a shared durable store and can fail on read-only or ephemeral deployments. Metrics are only in-memory webhook counts. No code links the callback to outgoing messages or updates notification state; store-side notification logs are created as `pending` and no corresponding update path was found. The production service marks overall success if *either* debit or credit is accepted, and the UI presents that as sent even if the other fails. Demo successes are likewise interpreted as successes by callers that do not inspect `demo`.

**Evidence:** `app/api/sms/webhook/route.ts:10-70`; `lib/webhook-store.ts:4-18`; `lib/metrics.ts:1-15`; `lib/data-store.ts:776-784,1080-1103`; `lib/production-alerts.ts:132-134`; `components/transaction-success.tsx:70-75`; `app/api/sms/send/route.ts:39-56`.

**Action:** Verify provider signatures using the documented scheme, reject or quarantine invalid callbacks, persist before acknowledging, deduplicate/reconcile by actual provider ID, and track each recipient separately through queued, accepted, delivered, failed and unknown states. Separate demo/simulated status visibly from real delivery.

### P1 — Retry behavior can duplicate messages and amplify failures

The adapter retries selected server/network errors; `SMSService.retryFetch` separately retries every non-2xx response up to three total times, including permanent 4xx errors. Each outer request can invoke up to three adapter attempts, yielding as many as nine provider requests for a single service call in some failure cases. No idempotency key is sent. A timeout can occur after provider acceptance, so blind retry can send duplicates. The adapter parses JSON before checking HTTP status, and an abort error is not necessarily identified by its message as a timeout. A separate exponential-backoff/error categorization helper exists, but no production callers were found.

**Evidence:** `lib/sms-service.ts:33-65`; `lib/sms-gateways/vartech-gateway.ts:35-105`; `lib/sms-gateways/base-gateway.ts:21-33`; `lib/sms-error-handler.ts:126-183`.

**Action:** Implement one retry policy with explicit retryable statuses, jitter, `Retry-After` support and a maximum budget. Use provider-supported idempotency and reconciliation for ambiguous outcomes; do not retry invalid input or authentication failures.

### P2 — Validation, privacy and SMS economics

The server checks presence, not type, length, supported region, phone validity, or recipient authorization. The unused `SMSService.validatePhoneNumber` is not applied to the API send routes, and the gateway formatter assumes every non-234 number is Nigerian. Variable sender names can be constructed from recipient-bank names, potentially conflicting with provider registration and branding rules. Branded templates, account information, balances and full phone numbers require privacy and consent review; logs currently include recipients and, in demo mode, a message excerpt. Unicode currency symbols, emoji, and decorative lines may increase segment counts; the code does not calculate encoding, segments, or cost. The optional `Reply STOP` text has no demonstrated inbound opt-out implementation and should not claim an unsupported capability.

**Evidence:** `app/api/sms/send/route.ts:17-29,42-47`; `lib/sms-service.ts:147-158,256-259`; `lib/sms-gateways/base-gateway.ts:46-57`; `hooks/use-sms-alert.ts:20-29`; `components/sms-template-composer.tsx:69-72`; `app/api/sms/business-card/route.ts:58-67`.

**Action:** Validate normalized E.164 numbers against supported destinations, authorize and verify recipients, apply provider-approved sender IDs, minimize and mask sensitive data, implement preference/consent handling appropriate to the message category, and measure GSM-7/UCS-2 segment counts and spend. Obtain legal and provider guidance for relevant jurisdictions rather than assuming compliance.

## Testing and operational readiness

- **What was tested:** repository source and configuration were inspected; `npm run` was used to enumerate available scripts. No application or provider integration tests were run, no live network call was made, and no SMS was sent. The checkout has no installed `node_modules` and no `test` script in `package.json`.
- There is a Vitest-style `__tests__/sms-error-handler.test.ts`, but `vitest` is not declared in `package.json` and no test runner script is configured. That file covers the standalone error categorizer/backoff formatter, not the actual VarTech adapter, API authorization, real transaction paths, idempotency, webhook authentication or delivery reconciliation.
- The route named `production-test` calls a service that uses `fetch('/api/sms/send')` from server-side code; a relative URL is not a valid absolute URL for standard Node server-side fetch, so these calls are expected to fail there. The test suite hardcodes `http://localhost:3000`, making it environment-dependent; its send test may call the real gateway rather than demo mode. Gateway initialization alone does not test connectivity.
- `next.config.mjs` disables TypeScript and ESLint build checks. In particular, `GatewayName` permits only `vartech`, while the default `smsGatewayConfigs` includes other names. A successful Next build would not by itself establish type correctness.

Evidence: `package.json`; `__tests__/sms-error-handler.test.ts:1-86`; `app/api/sms/production-test/route.ts:39-76`; `lib/production-alerts.ts:37,153-173`; `app/api/sms/test-suite/route.ts:113-125,148-154,194-205`; `next.config.mjs:2-8`; `lib/sms-gateways/types.ts:3-10`; `lib/data-store.ts:566-606`.

## Recommended delivery plan

1. **Contain:** Restrict/disable exposed SMS, test, settings and webhook routes; rotate potentially exposed keys; investigate provider logs and spending. Separate demo and production environments.
2. **Secure the boundary:** Authenticate and authorize all actions; remove client-provided provider URLs and secrets; enforce safe egress, input validation, quotas, spend controls and webhook verification.
3. **Unify the architecture:** Move credentials and config to a single server-side source. Replace browser-triggered overlapping sends with a durable transaction outbox and worker, per-recipient notification records and idempotency.
4. **Correct the content:** Use verified phone numbers, actual sender/recipient identities and canonical bank IDs; omit unknown balances; bind the editor to the approved rendering pipeline; validate placeholders, sender IDs and SMS segment costs.
5. **Reconcile delivery:** Persist provider IDs and attempts, authenticate and deduplicate callbacks, expose per-recipient acceptance/delivery/failure status, and alert operators on backlogs and failures.
6. **Prove readiness:** Configure a real test runner and type checks; add unit and integration tests for routes, adapter contract, retries, deduplication, preferences, template content, status transitions, and security. Run sandbox provider tests followed by a controlled real-device pilot with approved sender IDs and callback verification.

## Acceptance criteria before production

- No secret returned to clients; authenticated and authorized access to every billable/configuration endpoint; SSRF and abuse tests pass.
- One transaction event produces no more than one intended message per recipient/type, including retries and page refreshes; alert preferences are honored.
- Every message has a validated destination, approved sender, correct transaction details and no fabricated balance or unresolved placeholder.
- Provider acceptance, simulated sends and actual delivery are distinct states; callbacks are authenticated, durable, idempotent and correlated to actual provider IDs.
- Integration tests cover provider errors, non-JSON responses, timeouts, 429s, duplicate callbacks and multi-instance behavior; test routes cannot send real SMS unexpectedly.
- Successful controlled real-device delivery and callback reconciliation have been observed for each supported use case and destination, with operational alerts and spend limits in place.
