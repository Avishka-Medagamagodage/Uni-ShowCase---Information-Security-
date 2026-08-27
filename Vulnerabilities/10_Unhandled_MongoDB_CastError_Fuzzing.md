# 🔵 Vulnerability 10: Unhandled MongoDB CastError Parameter Fuzzing

## 1. Executive Summary
* **Vulnerability Title**: Unhandled Database Type Casting Exceptions & Parameter Fuzzing Stack Leakage
* **Severity**: **LOW**
* **CVSS v3.1 Score**: **4.3** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N)
* **CWE Identifier**:
  * [CWE-754: Improper Check for Unusual or Exceptional Conditions](https://cwe.mitre.org/data/definitions/754.html)
* **OWASP Top 10 Category**: **A04:2021 – Insecure Design**
* **Affected File**:
  * `Backend/src/app.js`

---

## 2. Description & Root Cause Analysis
When client requests contained malformed MongoDB ObjectIDs (e.g. `/api/projects/abc123notanid` or `/api/users/999`), Mongoose threw a `CastError`.

Because individual controllers did not wrap every `findById` call with format checks or map `CastError` to standard 400 responses, the errors propagated to the global handler, which returned generic 500 Internal Server Errors and printed full server stack traces to console logs.

---

## 3. Impact & Exploitation Scenario
* **Internal Server Error Flooding (500 Status)**: Parameter fuzzing tools could trigger hundreds of 500 status codes.
* **Information Leakage**: Unhandled exceptions exposed database query structure and internal Mongoose error signatures.

---

## 4. Remediation & How It Was Fixed
Added automated exception mapping in the global error handler in `Backend/src/app.js`:

```javascript
// ✅ SECURE IMPLEMENTATION in Backend/src/app.js:
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid resource identifier format: ${err.value}` });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});
```

---

## 5. Verification & Testing
* Tested querying `/api/projects/invalid-id`; the server returned a clean `400 Bad Request` with `{"message":"Invalid resource identifier format: invalid-id"}` instead of a 500 error.
