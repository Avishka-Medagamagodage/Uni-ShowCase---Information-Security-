# 🟠 Vulnerability 03: Unauthenticated WebSocket (Socket.io) Registration & Eavesdropping

## 1. Executive Summary
* **Vulnerability Title**: Unauthenticated WebSocket Connection & Insecure Direct Object Reference (IDOR) on Real-Time Channels
* **Severity**: **HIGH**
* **CVSS v3.1 Score**: **8.2** (CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N)
* **CWE Identifiers**:
  * [CWE-306: Missing Authentication for Critical Function](https://cwe.mitre.org/data/definitions/306.html)
  * [CWE-284: Improper Access Control](https://cwe.mitre.org/data/definitions/284.html)
* **OWASP Top 10 Category**: **A01:2021 – Broken Access Control**
* **Affected Files**:
  * `Backend/src/app.js`
  * `Backend/src/socket/socketManager.js`
  * `frontend/src/context/AuthContext.jsx`

---

## 2. Description & Root Cause Analysis
Socket.io allowed incoming connections without any authentication check. After connecting, the backend trusted an arbitrary client-sent payload:

```javascript
// ❌ VULNERABLE CODE in Backend/src/app.js:
io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    if (userId) {
      registerSocket(userId, socket.id);
    }
  });
});
```

Because the handshake was open to anyone and the client could register any `userId`, any unauthenticated client could spoof another user's ID.

---

## 3. Impact & Exploitation Scenario
* **Real-Time Notification Eavesdropping**: An attacker could connect to Socket.io, emit `register` with an Administrator or Student ID, and receive all live push notifications (e.g. project approvals, student follows, system notifications) intended for that user.
* **Notification Hijacking / DoS**: The attacker could overwrite socket mappings, diverting real-time updates away from legitimate users.

---

## 4. Remediation & How It Was Fixed
1. **Server-Side Authentication Handshake**: Added JWT verification middleware (`io.use`) in `Backend/src/app.js`.
2. **Server-Derived Identity**: The client event `socket.on('register', ...)` was eliminated; `socket.userId` is now extracted directly from the verified JWT payload (`decoded.id`).
3. **Client-Side Auth**: Updated `frontend/src/context/AuthContext.jsx` to pass `auth: { token }` on connect.

### A. Server Implementation (`Backend/src/app.js`)
```javascript
// ✅ SECURE IMPLEMENTATION:
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || 
    (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.startsWith('Bearer ') 
      ? socket.handshake.headers.authorization.split(' ')[1] 
      : null);

  if (!token) {
    return next(new Error('Authentication error: Missing token'));
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    socket.userId = (decoded.id || decoded._id).toString();
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  if (socket.userId) {
    registerSocket(socket.userId, socket.id);
    console.log(`[Socket] Authenticated User ${socket.userId} (${socket.userRole}) connected → socket ${socket.id}`);
  }

  socket.on('disconnect', () => {
    if (socket.userId) {
      removeSocket(socket.userId, socket.id);
    }
  });
});
```

### B. Client Implementation (`frontend/src/context/AuthContext.jsx`)
```javascript
// ✅ SECURE IMPLEMENTATION:
const s = io(BACKEND_URL, { 
  transports: ['websocket', 'polling'],
  auth: { token }
});
```

---

## 5. Verification & Testing
* Tested unauthenticated WebSocket connections; connections were rejected immediately with `Authentication error: Missing token`.
* Verified that authenticated users connect securely and only receive notifications for their own verified `userId`.
