# 🎓 UniShowcase — Student Project Showcase Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063.svg?style=flat&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61dafb.svg?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646cff.svg?style=flat&logo=vite)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8+-010101.svg?style=flat&logo=socket.io)](https://socket.io)
[![Security Status](https://img.shields.io/badge/Security-OWASP%20Hardened-success.svg?style=flat&logo=shield)](./Vulnerabilities)

**UniShowcase** is a full-stack, enterprise-grade web application that allows university students to showcase their engineering projects, connect with industry recruiters, and receive academic feedback. The platform incorporates real-time notifications, Google OAuth authentication, role-based access control (RBAC), media asset storage, and an administrative moderation workflow.

---

## 📑 Table of Contents
1. [Key Features & User Roles](#-key-features--user-roles)
2. [Technology Stack](#-technology-stack)
3. [Security Hardening & OWASP Compliance](#-security-hardening--owasp-compliance)
4. [Environment Configuration & Sensitive Data](#-environment-configuration--sensitive-data)
5. [Database Setup & Creation Script](#-database-setup--creation-script)
6. [Local Development Setup](#-local-development-setup)
7. [Production Deployment Guide](#-production-deployment-guide)
8. [API Endpoints Overview](#-api-endpoints-overview)
9. [Project Directory Structure](#-project-directory-structure)

---

## 🌟 Key Features & User Roles

### 🧑‍🎓 Student Experience
* **Project Showcase**: Upload engineering projects with titles, rich descriptions, technology tags, live demo links, repository URLs, cover images, and screenshot galleries.
* **Drafts & Moderation Workflow**: Projects start as private drafts and are published upon admin/recruiter approval.
* **Engagement & Analytics**: Receive likes, bookmarks, and follower updates from recruiters in real time.

### 💼 Recruiter Experience
* **Talent Discovery**: Filter projects by tech stacks, keywords, and student profiles.
* **Student Tracking**: Follow top students to receive live push notifications when they publish new projects.
* **Project Review & Publishing**: Review submitted student innovations and approve them for public exhibition.

### 👑 Administrator Experience
* **Role-Based Invitation Management**: Generate single-use, email-bound invitation tokens with custom roles (`Student`, `Recruiter`, `Admin`) and automated email dispatch via SMTP.
* **Bulk Invitations**: Upload multiple email invitations simultaneously.
* **Platform Governance**: Review, moderate, publish, or remove submitted projects and manage registered users.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion, Lucide Icons | Responsive UI, fluid animations, and client-side routing |
| **Backend** | Node.js, Express 4, Socket.io | REST API, WebSocket server, rate limiting, and business logic |
| **Database** | MongoDB & Mongoose ORM | Document storage for users, projects, interactions, and invitations |
| **Authentication** | Google OAuth 2.0 (OIDC) & Signed JWTs | Single Sign-On (SSO) with strict email-bound invitations |
| **Media Storage** | Cloudinary API & Multer (Memory Storage) | Secure media handling, cloud image optimization, and CDN delivery |
| **Email Service** | Nodemailer (SMTP / Gmail App Passwords) | Automated transactional invitation emails |

---

## 🛡️ Security Hardening & OWASP Compliance

This repository has undergone a comprehensive security audit and has been hardened against common web application vulnerabilities (OWASP Top 10):

| # | Vulnerability Addressed | Severity | Description & Fix |
|---|---|---|---|
| **01** | **Hardcoded JWT Fallback** | `CRITICAL (9.8)` | Removed static fallback keys. The server strictly enforces `process.env.JWT_SECRET` and fails closed on boot if missing. |
| **02** | **Invite Replay & Privilege Escalation** | `CRITICAL (9.6)` | Enforced atomic DB status verification (`Pending` ➔ `Completed`) and strict Google email-to-token matching. |
| **03** | **Unauthenticated WebSocket Registration** | `HIGH (8.2)` | Added JWT handshake verification (`io.use`) and server-derived identity binding for all real-time push channels. |
| **04** | **Broken Access Control on Project Publishing** | `HIGH (7.5)` | Enforced `isPublic: false` default on creation; restricted publishing actions to `Admin` and `Recruiter` roles. |
| **05** | **ReDoS & NoSQL Query Injection** | `HIGH (7.5)` | Sanitized all search inputs and tag filters with regex escaping (`escapeRegex`) before executing database queries. |
| **06** | **Stored XSS via Dangerous URI Schemes** | `MEDIUM (6.5)` | Enforced strict `http://` / `https://` whitelisting for `demoUrl` and `gitRepoUrl` across backend and frontend. |
| **07** | **Permissive Wildcard CORS** | `MEDIUM (6.5)` | Removed wildcard `.vercel.app` origin matching; bound CORS strictly to configured trusted origins. |
| **08** | **Unrestricted File Uploads** | `MEDIUM (6.3)` | Added dual MIME/extension whitelisting (`.jpg`, `.jpeg`, `.png`, `.webp`), 5MB size limits, and sanitized Cloudinary public IDs. |
| **09** | **Missing Security Headers & Rate Limits** | `MEDIUM (5.8)` | Configured `helmet` security headers and `express-rate-limit` on general and authentication endpoints. |
| **10** | **Unhandled CastError Parameter Fuzzing** | `LOW (4.3)` | Intercepted invalid MongoDB Object IDs in global error handling, returning clean `400 Bad Request` responses. |

> 📖 **Full Security Reports**: Detailed technical breakdowns and before/after code diffs are available in the **[`Vulnerabilities/`](./Vulnerabilities)** directory.

---

## 🔑 Environment Configuration & Sensitive Data

> [!IMPORTANT]
> **No active credentials or secrets are committed to this repository.** All sensitive configuration keys are read from local environment files (`.env`), which are excluded via `.gitignore`.

### 1. Backend Environment Variables (`Backend/.env`)
Copy `Backend/.env.example` to `Backend/.env` and supply your actual credentials:

```bash
cp Backend/.env.example Backend/.env
```

| Variable | Description | Example / Required Format |
|---|---|---|
| `PORT` | Port the backend server listens on | `5000` |
| `MONGODB_URI` | MongoDB connection string (Local or MongoDB Atlas) | `mongodb://127.0.0.1:27017/net_centric_app` or Atlas URI |
| `JWT_SECRET` | Strong cryptographic secret for signing JWT tokens | Generate with `openssl rand -base64 48` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `GOCSPX-your_google_secret` |
| `GOOGLE_CALLBACK_URL` | OAuth redirect callback URI | `http://localhost:5000/api/auth/google/callback` |
| `SMTP_HOST` | Transactional email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | Email address used to send invitations | `your_university_email@gmail.com` |
| `SMTP_PASS` | Google Account App Password (16 characters) | `xxxx xxxx xxxx xxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name (for media uploads) | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_cloudinary_api_secret` |
| `FRONTEND_URL` | Allowed frontend origin(s) for CORS (comma-separated) | `http://localhost:5173,https://your-app.vercel.app` |

---

### 2. Frontend Environment Variables (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Description | Example |
|---|---|---|
| `VITE_BACKEND_URL` | Base HTTP & WebSocket URL of the backend API | `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID (matches Backend) | `123456789-abc.apps.googleusercontent.com` |

---

## 🗄️ Database Setup & Creation Script

The database schema, collection indexes, and initial Administrator account can be initialized automatically using the built-in database setup script.

### Prerequisites
* Ensure your local MongoDB instance is running, or obtain a connection string from [MongoDB Atlas](https://www.mongodb.com/atlas).
* Ensure `MONGODB_URI` is set in your `Backend/.env`.

### Running the Database Initialization Script
From the `Backend/` folder, run:

```bash
cd Backend
npm run seed
```

This automated script will:
1. Establish a verified connection to MongoDB.
2. Build and synchronize unique indexes for `Users`, `Projects`, `Invitations`, `Likes`, `Followers`, and `Notifications`.
3. Create an initial **Administrator account** if one does not already exist.

```text
🚀 Starting UniShowcase Database Initialization...
📡 Connecting to MongoDB...
✅ Connected to MongoDB successfully.
📦 Building collection indexes...
✅ All model indexes synchronized.
👑 Initial Administrator created: admin@university.edu (System Administrator)

📊 Database Status Overview:
   - Users:        1
   - Projects:     0
   - Invitations:  0

✨ Database initialization completed successfully!
```

*(Optional: To create a custom initial admin account directly, you can run `npm run seed:admin`.)*

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/Uni-ShowCase---Information-Security-.git
cd Uni-ShowCase---Information-Security-
```

### 2. Backend Installation & Launch
```bash
# Navigate to Backend folder
cd Backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB, JWT, Google, and Cloudinary keys

# Initialize the database
npm run seed

# Start development server with hot-reload
npm run dev
```
> The Backend API will start running at: `http://localhost:5000`

---

### 3. Frontend Installation & Launch
Open a new terminal window:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start Vite development server
npm run dev
```
> The Frontend Web App will start running at: `http://localhost:5173`

---

## 🚀 Production Deployment Guide

### A. Deploying Backend (e.g. Render / Railway / Vercel Serverless)
1. **Set Environment Variables**: In your hosting platform dashboard, add all variables defined in `Backend/.env.example` (`MONGODB_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `CLOUDINARY_*`, `FRONTEND_URL`, etc.).
2. **Build & Start Commands**:
   * Build Command: `npm install`
   * Start Command: `npm start`
3. **Database Migration**: Run `npm run seed` once in your deployment console to ensure collection indexes are initialized.

### B. Deploying Frontend (e.g. Vercel / Netlify)
1. **Set Environment Variables**:
   * `VITE_BACKEND_URL`: Your deployed backend production URL (e.g. `https://api.yourdomain.com`).
   * `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Web Client ID.
2. **Google OAuth Authorized Origins**:
   * In [Google Cloud Console](https://console.cloud.google.com/), add your production frontend domain to **Authorized JavaScript origins** and your backend URL to **Authorized redirect URIs**.
3. **Build Settings**:
   * Build Command: `npm run build`
   * Output Directory: `dist`

---

## 📡 API Endpoints Overview

### Authentication & Invitations (`/api/auth`)
* `POST /api/auth/google` — Authenticate user via Google OAuth ID token.
* `POST /api/auth/invite` — Generate single-use email invitation (`Admin` only, rate-limited).
* `POST /api/auth/invite/bulk` — Generate bulk invitations (`Admin` only).
* `GET /api/auth/invitations` — List generated platform invitations (`Admin` only).

### Project Management (`/api/projects`)
* `GET /api/projects` — Fetch public projects with search, tech stack filtering, and pagination.
* `POST /api/projects` — Create project with cover image and screenshot uploads (Requires Auth).
* `GET /api/projects/:id` — Get project details by ID.
* `PUT /api/projects/:id` — Update project metadata, links, and screenshots.
* `DELETE /api/projects/:id` — Delete project (`Owner` or `Admin`).
* `PATCH /api/projects/:id/visibility` — Publish or unpublish project (`Admin` or `Recruiter`).

### Social & Interactions (`/api`)
* `POST /api/projects/:projectId/like` — Toggle like status on a project.
* `GET /api/projects/:projectId/like` — Get total likes and current user's like state.
* `POST /api/students/:studentId/follow` — Follow or unfollow a student (`Recruiter` only).
* `GET /api/students/:studentId/follow` — Get recruiter follow status.

### Notifications & Users
* `GET /api/notifications` — Fetch user's in-app notification feed.
* `PATCH /api/notifications/:id/read` — Mark notification as read.
* `GET /api/users` — Directory search and user management (`Admin` only).
* `DELETE /api/users/:id` — Delete user account and associated projects (`Admin` only).

---

## 📂 Project Directory Structure

```text
Uni-ShowCase---Information-Security-/
├── Backend/
│   ├── src/
│   │   ├── config/              # MongoDB connection & configuration
│   │   ├── controllers/         # Express route controllers
│   │   ├── events/              # Event emitters and notification listeners
│   │   ├── middlewares/         # Auth, Upload, and Security middlewares
│   │   ├── models/              # Mongoose database models
│   │   ├── routes/              # Express API route declarations
│   │   ├── scripts/             # Database initialization & seeding scripts
│   │   ├── services/            # Core business logic services
│   │   ├── socket/              # Real-time WebSocket manager
│   │   ├── utils/               # Sanitization, Cloudinary, and JWT helpers
│   │   └── app.js               # Express application entrypoint
│   ├── .env.example             # Backend environment template
│   ├── seedAdmin.js             # One-time admin seeding script
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components & navigation
│   │   ├── context/             # AuthContext and global state
│   │   ├── pages/               # Showcase, Dashboards, and Project Views
│   │   ├── services/            # Frontend API service layer
│   │   ├── App.jsx              # Main React router
│   │   └── main.jsx
│   ├── .env.example             # Frontend environment template
│   └── package.json
│
├── Vulnerabilities/             # Detailed security reports (CWE & OWASP)
│   ├── 01_Hardcoded_Cryptographic_Secret_Fallback.md
│   ├── 02_Privilege_Escalation_and_Invite_Token_Replay.md
│   ├── 03_Unauthenticated_WebSocket_Registration.md
│   ├── 04_Broken_Access_Control_Project_Visibility_Bypass.md
│   ├── 05_ReDoS_and_NoSQL_Query_Injection.md
│   ├── 06_Stored_XSS_Dangerous_URL_Schemes.md
│   ├── 07_Permissive_Wildcard_CORS_Bypass.md
│   ├── 08_Unrestricted_File_Upload_MIME_Bypass.md
│   ├── 09_Missing_Security_Headers_and_Rate_Limiting.md
│   ├── 10_Unhandled_MongoDB_CastError_Fuzzing.md
│   └── README.md
│
└── README.md                    # Platform documentation
```

---

## 📄 License
This project is developed for academic and showcase purposes under the **MIT License**.