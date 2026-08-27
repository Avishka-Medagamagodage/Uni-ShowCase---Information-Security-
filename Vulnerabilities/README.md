# 🛡️ UniShowcase Security Vulnerability & Remediation Report

This directory contains comprehensive security documentation for all vulnerabilities identified, analyzed, and remediated in the **UniShowcase** application.

---

## 📊 Vulnerability Index & Severity Matrix

| # | Vulnerability Name | Severity | CWE | OWASP Category | Status | Documentation Link |
|---|---|---|---|---|---|---|
| **01** | Insecure Hardcoded JWT Secret Fallback | **CRITICAL (9.8)** | CWE-798, CWE-321 | A02: Cryptographic Failures | ✅ **Fixed** | [Read Report](./01_Hardcoded_Cryptographic_Secret_Fallback.md) |
| **02** | Privilege Escalation & Invite Token Replay / Theft | **CRITICAL (9.6)** | CWE-287, CWE-269 | A01: Broken Access Control | ✅ **Fixed** | [Read Report](./02_Privilege_Escalation_and_Invite_Token_Replay.md) |
| **03** | Unauthenticated WebSocket (Socket.io) Registration | **HIGH (8.2)** | CWE-306, CWE-284 | A01: Broken Access Control | ✅ **Fixed** | [Read Report](./03_Unauthenticated_WebSocket_Registration.md) |
| **04** | Broken Access Control: Student Visibility Bypass | **HIGH (7.5)** | CWE-862 | A01: Broken Access Control | ✅ **Fixed** | [Read Report](./04_Broken_Access_Control_Project_Visibility_Bypass.md) |
| **05** | ReDoS (Regex Denial of Service) & NoSQL Query Injection | **HIGH (7.5)** | CWE-1333, CWE-943 | A03: Injection | ✅ **Fixed** | [Read Report](./05_ReDoS_and_NoSQL_Query_Injection.md) |
| **06** | Stored XSS via Dangerous URI Schemes (`javascript:`) | **MEDIUM (6.5)** | CWE-79 | A03: Injection | ✅ **Fixed** | [Read Report](./06_Stored_XSS_Dangerous_URL_Schemes.md) |
| **07** | Permissive Wildcard CORS Configuration (`*.vercel.app`) | **MEDIUM (6.5)** | CWE-942 | A05: Security Misconfiguration | ✅ **Fixed** | [Read Report](./07_Permissive_Wildcard_CORS_Bypass.md) |
| **08** | Insecure File MIME & Extension Validation (Uploads) | **MEDIUM (6.3)** | CWE-434 | A04: Insecure Design | ✅ **Fixed** | [Read Report](./08_Unrestricted_File_Upload_MIME_Bypass.md) |
| **09** | Missing Security HTTP Headers & Rate Limiting | **MEDIUM (5.8)** | CWE-693, CWE-770 | A05: Security Misconfiguration | ✅ **Fixed** | [Read Report](./09_Missing_Security_Headers_and_Rate_Limiting.md) |
| **10** | Unhandled MongoDB Object ID Fuzzing (`CastError`) | **LOW (4.3)** | CWE-754 | A04: Insecure Design | ✅ **Fixed** | [Read Report](./10_Unhandled_MongoDB_CastError_Fuzzing.md) |

---

## 🎯 Scope of Security Review

The security audit and hardening covered:
1. **Backend API**: Node.js, Express, MongoDB/Mongoose, Socket.io, Multer, Cloudinary, Nodemailer.
2. **Frontend Client**: React (Vite), Context API, Socket.io-client, UI Components, Protected Routes.
3. **Transport & Network**: CORS boundaries, Rate Limiting, HTTP security headers, WebSocket handshake authentication.
4. **Data Handling & Business Logic**: Invite token redemption, RBAC enforcement, Input sanitization, File validation.
