# 🟡 Vulnerability 09: Missing Security HTTP Headers & Rate Limiting

## 1. Executive Summary
* **Vulnerability Title**: Missing Defense-in-Depth HTTP Security Headers & Missing Rate Limiting on Sensitive Routes
* **Severity**: **MEDIUM**
* **CVSS v3.1 Score**: **5.8** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L)
* **CWE Identifiers**:
  * [CWE-693: Protection Mechanism Failure](https://cwe.mitre.org/data/definitions/693.html)
  * [CWE-770: Allocation of Resources Without Limits or Throttling](https://cwe.mitre.org/data/definitions/770.html)
* **OWASP Top 10 Category**: **A05:2021 – Security Misconfiguration**
* **Affected File**:
  * `Backend/src/app.js`

---

## 2. Description & Root Cause Analysis
1. **Missing Security Headers**: The Express server did not use `helmet` or custom headers, leaving responses without `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and leaking the `X-Powered-By: Express` header.
2. **Missing Rate Limiting**: Authentication (`/api/auth/google`) and invitation sending (`/api/auth/invite`, `/api/auth/invite/bulk`) had no rate limits, allowing automated bots to spam requests.

---

## 3. Impact & Exploitation Scenario
* **Clickjacking & MIME Sniffing**: Without frame protection and MIME sniffing prevention, browsers could be vulnerable to UI redressing and MIME-type confusion attacks.
* **Mail Quota Exhaustion & Brute Force**: Automated scripts could flood the `/api/auth/invite` endpoint to burn through university SMTP quotas.

---

## 4. Remediation & How It Was Fixed
1. **Installed & Configured `helmet`**:
   - Registered `helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })` to set secure response headers, disable `X-Powered-By: Express`, and enforce clickjacking protection.
2. **Installed & Configured `express-rate-limit`**:
   - `generalLimiter`: 200 requests per 15 minutes per IP.
   - `authLimiter`: 30 requests per 15 minutes per IP on `/api/auth/*`.

```javascript
// ✅ SECURE IMPLEMENTATION in Backend/src/app.js:
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again after 15 minutes' }
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);
```

---

## 5. Verification & Testing
* Inspected HTTP response headers; verified that `X-Powered-By` is removed and security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options`) are returned.
* Tested rate limit thresholds; excess requests receive `429 Too Many Requests`.
