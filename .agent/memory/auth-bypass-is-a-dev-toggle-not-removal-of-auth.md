---
title: AUTH_BYPASS is a dev toggle, not removal of auth
kind: decision
tags: security, auth, dev
updated: 2026-08-06
---
Browsing the scaffold without logging in is done with `AUTH_BYPASS=true` in .env, handled by app/middleware/dev_auto_login_middleware.ts.

**Why this shape:** the request was to skip login while scaffolding. Deleting the auth middleware would have thrown away the OWASP hardening and left no obvious way back. Instead the bypass signs the visitor in as the seeded admin, and **throws** if it ever finds itself running with NODE_ENV=production — a silent "everyone is an admin" in a deployed app is the worst possible failure mode.

The real login flow at /login is untouched and keeps working. Set AUTH_BYPASS=false before doing any auth work.
