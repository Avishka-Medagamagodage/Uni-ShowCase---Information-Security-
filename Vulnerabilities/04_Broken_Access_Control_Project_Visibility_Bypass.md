# 🟠 Vulnerability 04: Broken Access Control: Student Project Visibility Bypass

## 1. Executive Summary
* **Vulnerability Title**: Broken Object-Level Authorization & Business Logic Visibility Bypass
* **Severity**: **HIGH**
* **CVSS v3.1 Score**: **7.5** (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:N)
* **CWE Identifier**:
  * [CWE-862: Missing Authorization](https://cwe.mitre.org/data/definitions/862.html)
* **OWASP Top 10 Category**: **A01:2021 – Broken Access Control**
* **Affected File**:
  * `Backend/src/services/projectService.js`

---

## 2. Description & Root Cause Analysis
The university system requires all student-submitted projects to start as **Private** (`isPublic: false`) until approved and made public by an Administrator or Recruiter.

However:
1. In `createProject`, the service accepted `isPublic` directly from user input:
   ```javascript
   // ❌ VULNERABLE CODE:
   isPublic: projectData.isPublic === 'true' || projectData.isPublic === true
   ```
2. In `updateProject` (`PUT /api/projects/:id`), students could also pass `{ isPublic: true }` in the update payload to publish their own project.
3. In `getProjectById`, Recruiters were not restricted from fetching unapproved private project drafts directly by ID.

---

## 3. Impact & Exploitation Scenario
* **Content Moderation Bypass**: Any student could bypass the moderation review process and publish inappropriate or unapproved projects directly to the public feed.
* **Unauthorized Draft Inspection**: Recruiters could inspect private draft projects prior to review.

---

## 4. Remediation & How It Was Fixed
In `Backend/src/services/projectService.js`:

1. **Enforced Default Private State**: In `createProject`, `isPublic` is forced to `false` for students regardless of payload contents. Only Admins can set initial visibility.
2. **Protected Update Operations**: In `updateProject`, changes to `isPublic` are strictly ignored unless the user has the role `Admin` or `Recruiter`.
3. **Draft Inspection Boundary**: In `getProjectById`, Recruiters are restricted from fetching projects where `isPublic === false`.

```javascript
// ✅ SECURE IMPLEMENTATION in Backend/src/services/projectService.js:
// In createProject:
const isPublic = user && user.role === 'Admin'
  ? (projectData.isPublic === 'true' || projectData.isPublic === true)
  : false;

// In updateProject:
if (updateData.isPublic !== undefined && (user.role === 'Admin' || user.role === 'Recruiter')) {
  project.isPublic = (updateData.isPublic === 'true' || updateData.isPublic === true);
}

// In getProjectById:
if (user.role === 'Student') {
  const isOwner = project.studentId._id.toString() === (user._id || user.id).toString();
  if (!project.isPublic && !isOwner) throw new Error('Access denied: Private project');
} else if (user.role === 'Recruiter') {
  if (!project.isPublic) throw new Error('Access denied: Private project');
}
```

---

## 5. Verification & Testing
* Tested project creation by a student with `isPublic: true`; verified that the project was stored with `isPublic: false`.
* Tested editing project visibility as a student; verified that `isPublic` remained unchanged.
