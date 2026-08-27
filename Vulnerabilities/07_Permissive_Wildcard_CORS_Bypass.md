# 🟡 Vulnerability 07: Permissive Wildcard CORS Configuration

## 1. Executive Summary
* **Vulnerability Title**: Insecure Wildcard Cross-Origin Resource Sharing (CORS) Policy
* **Severity**: **MEDIUM**
* **CVSS v3.1 Score**: **6.5** (CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:N/A:N)
* **CWE Identifier**:
  * [CWE-942: Permissive Cross-domain Policy with Untrusted Domains](https://cwe.mitre.org/data/definitions/942.html)
* **OWASP Top 10 Category**: **A05:2021 – Security Misconfiguration**
* **Affected File**:
  * `Backend/src/app.js`

---

## 2. Description & Root Cause Analysis
In `Backend/src/app.js`, the CORS origin verification logic contained a wildcard suffix rule while having `credentials: true` enabled:

```javascript
// ❌ VULNERABLE CODE:
const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Dynamically allow Vercel previews and deployment domains
  if (origin.endsWith('.vercel.app')) return true; // <-- VULNERABLE
  return false;
};
```

Because any user can register a free subdomain on Vercel (e.g. `evil-attacker.vercel.app`), an attacker could host a malicious web page that makes authenticated cross-origin requests with credentials to the backend.

---

## 3. Impact & Exploitation Scenario
* **Cross-Site Data Theft**: When a logged-in university member visited an attacker's website on Vercel, the attacker's script could make authenticated requests to `/api/projects`, `/api/notifications`, or `/api/users` and read private responses.
* **Unauthorized State Changes**: The attacker's site could trigger project deletions, user follows, or profile modifications on behalf of the victim.

---

## 4. Remediation & How It Was Fixed
The wildcard `.vercel.app` rule was eliminated. CORS origins are now strictly validated against explicit domains defined in `process.env.FRONTEND_URL` and designated local development ports:

```javascript
// ✅ SECURE IMPLEMENTATION in Backend/src/app.js:
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));
```

---

## 5. Verification & Testing
* Tested CORS requests from unauthorized origins (e.g. `http://malicious.vercel.app`); requests were blocked and returned a CORS error.
* Tested CORS requests from authorized origins (`http://localhost:5173`); requests succeeded normally.
