# Auth-Gated App Testing Playbook (Emergent Google Auth)

## Create Test User & Session (mongosh)
```
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({ user_id: userId, email: 'test.user.'+Date.now()+'@example.com', name: 'Test User', picture: 'https://via.placeholder.com/150', created_at: new Date() });
db.user_sessions.insertOne({ user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now()+7*24*60*60*1000), created_at: new Date() });
print(sessionToken); print(userId);
```

## Backend endpoints
- GET /api/auth/me  (cookie session_token OR Authorization: Bearer <token>)
- POST /api/auth/session (X-Session-ID header) -> exchanges via Emergent, sets cookie
- POST /api/auth/logout
- POST /api/orders (auth), GET /api/orders/me (auth)

## Admin (owner)
- POST /api/admin/login {username:'freefire', password:'rk212006'} -> {admin_token}
- PUT /api/admin/packages (X-Admin-Token), PUT /api/admin/settings (X-Admin-Token)

## Notes
- Google OAuth session-data endpoint requires a REAL session_id from browser flow; cannot be curl-tested directly. Use mongosh-inserted session_token to test /auth/me + orders.
- All user queries use {"_id":0}; user_id is custom UUID.
