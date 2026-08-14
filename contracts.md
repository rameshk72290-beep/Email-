# LootBar Free Fire Clone — API Contracts

## Data mocked in mock.js (to replace with backend)
- `packages` list + localStorage helpers -> now fetched from `GET /api/packages`
- `settings` -> `GET /api/settings`
- Admin edits (localStorage) -> `PUT /api/admin/packages`, `PUT /api/admin/settings` (protected)
- reviews, faqs, infoContent, serverTabs remain STATIC in frontend (not backend)

## Collections
- packages: {id, name, image, price, originalPrice, tag, order}
- settings: {_key:'main', productImage, title, rating, ratingCount, soldCount}
- users: {user_id, email, name, picture, created_at}
- user_sessions: {user_id, session_token, expires_at, created_at}
- admin_sessions: {admin_token, expires_at}
- orders: {order_id, user_id, package_name, uid, quantity, total, created_at}

## Endpoints (all /api)
### Public
- GET /api/packages -> [Package]
- GET /api/settings -> Settings

### Admin (owner only, creds in backend/.env)
- POST /api/admin/login {username,password} -> {admin_token}
- PUT /api/admin/packages  (X-Admin-Token) body:[Package] -> replace all
- PUT /api/admin/settings  (X-Admin-Token) body:Settings

### Client Google Auth (Emergent managed)
- POST /api/auth/session  (X-Session-ID header) -> user, sets httpOnly cookie session_token
- GET /api/auth/me -> user (cookie or Bearer)
- POST /api/auth/logout -> clears cookie

### Orders (client auth)
- POST /api/orders {package_name, uid, quantity, total} -> order
- GET /api/orders/me -> [order]

## Frontend integration
- HomePage loads packages+settings from API (fallback to mock defaults on error)
- AdminPage: login -> store admin_token in localStorage -> AdminPanel PUT saves
- Client login: 'Continue with Google' -> Emergent auth redirect -> AuthCallback exchanges session_id -> /api/auth/session
- Order panel 'Top-up Now' requires client login; creates order
