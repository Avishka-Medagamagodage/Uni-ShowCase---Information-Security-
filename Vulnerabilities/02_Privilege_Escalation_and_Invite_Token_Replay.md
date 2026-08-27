# 🔴 Vulnerability 02: Privilege Escalation & Invite Token Replay / Theft

## 1. Executive Summary
* **Vulnerability Title**: Insecure Invitation Workflow / Token Replay & Broken Email Binding
* **Severity**: **CRITICAL**
* **CVSS v3.1 Score**: **9.6** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
* **CWE Identifiers**:
  * [CWE-287: Improper Authentication](https://cwe.mitre.org/data/definitions/287.html)
  * [CWE-269: Improper Privilege Management](https://cwe.mitre.org/data/definitions/269.html)
* **OWASP Top 10 Category**: **A01:2021 – Broken Access Control** & **A07:2021 – Identification and Authentication Failures**
* **Affected File**:
  * `Backend/src/services/authService.js`

---

## 2. Description & Root Cause Analysis
The invitation system was vulnerable to two severe logic flaws in `processUserRegistration`:

1. **Token Replay Vulnerability**:
   `validateInvite(token)` only validated the cryptographic signature of the token, never checking whether the invitation in MongoDB was already in the `Completed` state. Because the check was non-atomic and failed to query database status beforehand, the same invite token could be replayed endlessly to register unlimited accounts.
2. **Missing Email-to-Token Binding (Account Theft)**:
   When an administrator invited an email (e.g. `dean@university.edu`) with the `Admin` role, the server never verified that the person signing into Google possessed the invited email address. An attacker with any intercepted invite token could log into their own Google account (`attacker@gmail.com`) and claim the `Admin` role.

---

## 3. Impact & Exploitation Scenario
* **Unauthorized Role Assumption**: Any user who acquired an invitation link intended for faculty or administrators could register as an `Admin` or `Recruiter`.
* **Account Flood & Invite Replay**: Once an invite was generated, it could be used infinitely by automated bots to create accounts.

---

## 4. Remediation & How It Was Fixed
The registration flow was patched to enforce strict email matching and atomic database state transitions:

```javascript
// ✅ SECURE IMPLEMENTATION in Backend/src/services/authService.js:
const normalizedEmail = email.toLowerCase().trim();

let role = 'Student';
if (inviteToken) {
  const decodedInvite = this.validateInvite(inviteToken);

  // 1. Strict Email Verification
  if (decodedInvite.email && decodedInvite.email.toLowerCase().trim() !== normalizedEmail) {
    throw new Error(`Invitation mismatch: This invite token was issued for "${decodedInvite.email}", but you authenticated with "${normalizedEmail}". Please sign in with the invited email address.`);
  }

  // 2. Atomic Database Status Verification & Completion
  const Invitation = require('../models/Invitation');
  const invitationRecord = await Invitation.findOneAndUpdate(
    { 
      token: inviteToken, 
      status: 'Pending',
      email: normalizedEmail
    },
    { 
      $set: { status: 'Completed' } 
    },
    { 
      new: true 
    }
  );

  if (!invitationRecord) {
    throw new Error('Invitation token is invalid, expired, or has already been used.');
  }

  role = invitationRecord.role || decodedInvite.role || 'Student';
}
```

---

## 5. Verification & Testing
* Tested registering with a mismatched Google email; the backend promptly rejected the registration with `Invitation mismatch`.
* Tested reusing an already completed invite token; the backend rejected the attempt with `Invitation token is invalid, expired, or has already been used`.
