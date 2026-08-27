# 🟠 Vulnerability 05: Regular Expression Denial of Service (ReDoS) & NoSQL Query Injection

## 1. Executive Summary
* **Vulnerability Title**: Regular Expression Denial of Service (ReDoS) & Unsanitized Query Metacharacter Injection
* **Severity**: **HIGH**
* **CVSS v3.1 Score**: **7.5** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H)
* **CWE Identifiers**:
  * [CWE-1333: Inefficient Regular Expression Complexity](https://cwe.mitre.org/data/definitions/1333.html)
  * [CWE-943: Improper Neutralization of Special Elements in Data Query Logic](https://cwe.mitre.org/data/definitions/943.html)
* **OWASP Top 10 Category**: **A03:2021 – Injection**
* **Affected Files**:
  * `Backend/src/services/projectService.js`
  * `Backend/src/controllers/userController.js`
  * `Backend/src/utils/sanitize.js`

---

## 2. Description & Root Cause Analysis
In `projectService.js` (`getProjects`) and `userController.js` (`getAllUsers`), search query strings and technology filters from `req.query` were passed directly into MongoDB `$regex` queries and `new RegExp(...)` without escaping regex special characters:

```javascript
// ❌ VULNERABLE CODE:
if (search) {
  query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ];
}
if (technologies) {
  const techArray = technologies.split(',').map(t => t.trim());
  query.technologiesUsed = { $in: techArray.map(t => new RegExp(t, 'i')) };
}
```

Attackers could pass nested quantifiers (e.g. `?search=((a+)+)+$`) or unescaped regex metacharacters (`*`, `+`, `?`, `^`, `$`, `(`, `)`, `[`, `]`, `{`, `}`, `|`, `\`).

---

## 3. Impact & Exploitation Scenario
* **Denial of Service (Node.js Event Loop Freeze)**: Specially crafted regex strings trigger catastrophic exponential backtracking in the JavaScript engine (V8), locking the single-threaded Node.js event loop and rendering the backend completely unresponsive.
* **Server Crashes & Unhandled Exceptions**: Unbalanced parentheses or invalid quantifiers cause runtime `SyntaxError: Invalid regular expression` crashes.

---

## 4. Remediation & How It Was Fixed
1. **Created Sanitization Utility in `Backend/src/utils/sanitize.js`**:
   ```javascript
   const escapeRegex = (str) => {
     if (typeof str !== 'string') return '';
     return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   };
   ```
2. **Applied Type Verification & Sanitized Queries in `projectService.js` and `userController.js`**:
   ```javascript
   // ✅ SECURE IMPLEMENTATION in Backend/src/services/projectService.js:
   if (typeof search === 'string' && search.trim() !== '') {
     const sanitizedSearch = escapeRegex(search.trim());
     query.$and = query.$and || [];
     query.$and.push({
       $or: [
         { title: { $regex: sanitizedSearch, $options: 'i' } },
         { description: { $regex: sanitizedSearch, $options: 'i' } }
       ]
     });
   }

   if (technologies) {
     let techArray = [];
     if (Array.isArray(technologies)) {
       techArray = technologies.filter(t => typeof t === 'string').map(t => t.trim());
     } else if (typeof technologies === 'string') {
       techArray = technologies.split(',').map(t => t.trim()).filter(Boolean);
     }
     if (techArray.length > 0) {
       const sanitizedTechs = techArray.map(t => new RegExp(`^${escapeRegex(t)}$`, 'i'));
       query.technologiesUsed = { $in: sanitizedTechs };
     }
   }
   ```

---

## 5. Verification & Testing
* Tested searching with complex regex strings `?search=((a+)+)+$`, `?search=.*.*.*.*.*`, and `?search=[[[[[`; queries executed safely as literal string searches in under 10ms without any backtracking or crashes.
