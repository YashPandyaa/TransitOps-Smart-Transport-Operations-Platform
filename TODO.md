# TODO - TransitOps Auth + RBAC

- [x] Implement backend `POST /api/auth/login` (JWT with user_id + role)
- [x] Fill backend `backend/src/middleware/auth.js` robustness for `requireAuth` + `requireRole`
- [x] Add backend seed script: `backend/scripts/seedUsers.js` (4 roles, bcrypt-hashed passwords)
- [x] Add frontend AuthContext (in-memory token, not localStorage)
- [x] Implement frontend Login page calling `/api/auth/login`
- [x] Add frontend ProtectedRoute wrapper (redirect to /login)
- [x] Update frontend routing to protect all app pages
- [x] Implement role-aware NavBar using the provided role-to-menu matrix
- [x] Protect corresponding backend routes/pages (server-side RBAC middleware wiring)

- [ ] Run quick smoke tests (migrate, seed, login, token rejection)


