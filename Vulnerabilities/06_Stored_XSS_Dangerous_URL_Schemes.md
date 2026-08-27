# 🟡 Vulnerability 06: Stored Cross-Site Scripting (XSS) via Dangerous URI Schemes

## 1. Executive Summary
* **Vulnerability Title**: Stored Cross-Site Scripting (XSS) via Dangerous URI Schemes (`javascript:`, `data:`, `vbscript:`)
* **Severity**: **MEDIUM**
* **CVSS v3.1 Score**: **6.5** (CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N)
* **CWE Identifier**:
  * [CWE-79: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')](https://cwe.mitre.org/data/definitions/79.html)
* **OWASP Top 10 Category**: **A03:2021 – Injection**
* **Affected Files**:
  * `Backend/src/services/projectService.js`
  * `Backend/src/utils/sanitize.js`
  * `frontend/src/components/ProjectCard.jsx`
  * `frontend/src/pages/ProjectDetail.jsx`
  * `frontend/src/pages/AdminDashboard.jsx`

---

## 2. Description & Root Cause Analysis
The backend accepted `demoUrl` and `gitRepoUrl` in project creation and update requests without protocol or scheme verification.

On the frontend, these URLs were rendered directly in anchor tags:
```jsx
// ❌ VULNERABLE CODE:
<a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
  Live Demo
</a>
```

An attacker could supply `javascript:/* malicious script */` or `data:text/html,...` as their project's demo URL.

---

## 3. Impact & Exploitation Scenario
* **Stored Cross-Site Scripting (XSS)**: When another user, Recruiter, or Admin viewed the project and clicked **"Live Demo"** or **"View Repository"**, the malicious JavaScript payload executed in the victim's browser context.
* **Token Theft & Account Hijacking**: The script could access `localStorage.getItem('token')` and exfiltrate credentials to an external server.

---

## 4. Remediation & How It Was Fixed
1. **Server-Side URL Scheme Whitelisting**:
   Added `isValidHttpUrl()` and `sanitizeUrl()` in `Backend/src/utils/sanitize.js`, enforcing strict `http:` and `https:` schemes in `createProject` and `updateProject`.
2. **Frontend Defense-in-Depth**:
   Added `getSafeUrl()` in `ProjectCard.jsx`, `ProjectDetail.jsx`, and `AdminDashboard.jsx` to prevent rendering non-HTTP/HTTPS links in `href` attributes.

### A. Backend Validation (`Backend/src/services/projectService.js`)
```javascript
// ✅ SECURE IMPLEMENTATION:
if (projectData.demoUrl && !isValidHttpUrl(projectData.demoUrl)) {
  throw new Error('Invalid demoUrl: Only valid http:// and https:// URLs are allowed');
}
if (projectData.gitRepoUrl && !isValidHttpUrl(projectData.gitRepoUrl)) {
  throw new Error('Invalid gitRepoUrl: Only valid http:// and https:// URLs are allowed');
}
```

### B. Frontend Safe Link Rendering (`frontend/src/components/ProjectCard.jsx`)
```javascript
// ✅ SECURE IMPLEMENTATION:
const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
};

// In JSX:
{getSafeUrl(project.demoUrl) && (
  <a href={getSafeUrl(project.demoUrl)} target="_blank" rel="noopener noreferrer">
    <ExternalLink className="w-5 h-5" />
  </a>
)}
```

---

## 5. Verification & Testing
* Tested submitting `demoUrl: "javascript:alert(1)"`; the backend rejected the request with `Invalid demoUrl: Only valid http:// and https:// URLs are allowed`.
* Verified that only valid `http://` and `https://` URLs are rendered in anchor links across the frontend.
