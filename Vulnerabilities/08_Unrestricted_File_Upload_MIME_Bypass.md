# 🟡 Vulnerability 08: Insecure File MIME & Extension Validation (Uploads)

## 1. Executive Summary
* **Vulnerability Title**: Unrestricted File Upload & Insufficient MIME / Extension Verification
* **Severity**: **MEDIUM**
* **CVSS v3.1 Score**: **6.3** (CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:L)
* **CWE Identifier**:
  * [CWE-434: Unrestricted Upload of File with Dangerous Type](https://cwe.mitre.org/data/definitions/434.html)
* **OWASP Top 10 Category**: **A04:2021 – Insecure Design**
* **Affected Files**:
  * `Backend/src/middlewares/uploadMiddleware.js`
  * `Backend/src/utils/cloudinary.js`

---

## 2. Description & Root Cause Analysis
1. **Header-Trusting MIME Validation**: `uploadMiddleware.js` only checked `file.mimetype.startsWith('image/')`, trusting the client-supplied `Content-Type` header without verifying the file extension or rejecting executable image formats (such as `.svg` containing `<script>` tags).
2. **Unsafe Cloudinary Resource Handling**: `cloudinary.js` passed `resource_type: 'auto'` with raw, un-sanitized original filenames, allowing non-image files to be stored as raw assets.

---

## 3. Impact & Exploitation Scenario
* **Stored XSS via SVG Uploads**: An attacker could upload an SVG file with embedded JavaScript (`<svg onload="alert(document.cookie)">`). When a recruiter opened the image link, the script would execute.
* **Storage / Memory Exhaustion**: Uploading unbounded files could exhaust serverless memory limits.

---

## 4. Remediation & How It Was Fixed
1. **Double-Verification Whitelist (`uploadMiddleware.js`)**:
   - Strictly validates both MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/jpg`) **and** file extensions (`/\.(jpg|jpeg|png|webp)$/i`).
   - Enforced strict limits: maximum 5MB per file and a maximum of 6 files per request.
2. **Hardened Cloudinary Pipeline (`cloudinary.js`)**:
   - Strictly enforced `resource_type: 'image'`.
   - Sanitized all public IDs and filenames using `sanitizeFilename()` to strip path traversals and dangerous characters.

### A. Middleware Whitelist (`Backend/src/middlewares/uploadMiddleware.js`)
```javascript
// ✅ SECURE IMPLEMENTATION:
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_EXTENSIONS = /^\.(jpg|jpeg|png|webp)$/i;

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase());
  const isExtValid = ALLOWED_EXTENSIONS.test(ext);

  if (isMimeValid && isExtValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Only JPG, PNG, and WebP image files are allowed!'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    files: 6 
  }
});
```

### B. Storage Sanitization (`Backend/src/utils/cloudinary.js`)
```javascript
// ✅ SECURE IMPLEMENTATION:
const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return 'file';
  const base = path.parse(filename).name;
  return base.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
};

const uploadStream = cloudinary.uploader.upload_stream(
  { 
    folder, 
    public_id: `${folder}/${Date.now()}-${sanitizeFilename(originalname)}`, 
    resource_type: 'image', // Strictly enforce image type
    overwrite: true 
  },
  ...
);
```

---

## 5. Verification & Testing
* Tested uploading `.svg`, `.html`, and `.exe` files disguised with `Content-Type: image/png`; the upload middleware rejected them with `Invalid file type: Only JPG, PNG, and WebP image files are allowed!`.
* Tested valid JPG and PNG uploads; files processed successfully.
