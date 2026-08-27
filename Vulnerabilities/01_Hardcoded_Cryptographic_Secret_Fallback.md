# 🔴 Vulnerability 01: Insecure Hardcoded Cryptographic Secret Fallback

## 1. Executive Summary
* **Vulnerability Title**: Hardcoded Cryptographic Key / Insecure Secret Fallback
* **Severity**: **CRITICAL**
* **CVSS v3.1 Score**: **9.8** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
* **CWE Identifiers**:
  * [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
  * [CWE-321: Use of Hard-coded Cryptographic Key](https://cwe.mitre.org/data/definitions/321.html)
* **OWASP Top 10 Category**: **A02:2021 – Cryptographic Failures** & **A07:2021 – Identification and Authentication Failures**
* **Affected Files**:
  * `Backend/src/utils/inviteGenerator.js`
  * `Backend/src/middlewares/authMiddleware.js`

---

## 2. Description & Root Cause Analysis
The application uses JSON Web Tokens (JWT) for session management and user role authentication. However, both the token generation module (`inviteGenerator.js`) and the verification middleware (`authMiddleware.js`) contained a hardcoded fallback string when `process.env.JWT_SECRET` was undefined:

```javascript
// ❌ VULNERABLE CODE:
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_net_centric_2026';
```

If the `.env` file failed to load, was misnamed, or was omitted in a deployment environment, the server silently fell back to using this static, publicly readable key without logging any security warning.

---

## 3. Impact & Exploitation Scenario
* **Complete Authentication Bypass**: Any attacker reading the codebase could extract `'super_secret_jwt_key_net_centric_2026'` and forge valid JWT tokens containing arbitrary payload claims (e.g. `{ role: 'Admin', email: 'admin@university.edu' }`).
* **Privilege Escalation**: Any authenticated user could tamper with their JWT token, sign it using the fallback key, and gain full Administrator privileges.
* **Token Forgery**: Valid invitation tokens (`type: 'INVITE'`) could be generated offline to bypass registration invite controls.

---

## 4. Remediation & How It Was Fixed
The fallback string was completely removed and replaced with a centralized **fail-closed** secret getter function `getJwtSecret()`:

### A. Code Changes in `Backend/src/utils/inviteGenerator.js`
```javascript
// ✅ SECURE IMPLEMENTATION:
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is not defined.');
  }
  return secret;
};

const generateInviteToken = (role, email = '') => {
  return jwt.sign({ role, email, type: 'INVITE' }, getJwtSecret(), { expiresIn: '7d' });
};

const verifyInviteToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (decoded.type !== 'INVITE') throw new Error('Invalid token type');
    return decoded;
  } catch (error) {
    return null;
  }
};

const generateUserToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
};
```

### B. Code Changes in `Backend/src/middlewares/authMiddleware.js`
```javascript
// ✅ SECURE IMPLEMENTATION:
const { getJwtSecret } = require('../utils/inviteGenerator');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = await User.findById(decoded.id).select('-__v');
      if (!req.user) return res.status(401).json({ message: 'User non-existent or deleted' });
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token validation failed' });
    }
  }
  if (!token) return res.status(401).json({ message: 'Not authorized, missing bearer token' });
};
```

---

## 5. Verification & Testing
* Verified that the server throws an explicit configuration error if `JWT_SECRET` is missing.
* Verified that token signing and verification operate consistently using the environment-injected secret.
