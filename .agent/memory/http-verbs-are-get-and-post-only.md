---
title: HTTP verbs are GET and POST only
kind: decision
tags: routing, conventions
updated: 2026-08-06
---
Routes use GET and POST exclusively. No PUT, PATCH or DELETE anywhere.

**Why:** an explicit project decision, not a framework limitation. It keeps every mutation reachable from a plain HTML form with no method spoofing, which means forms keep working without JavaScript and there is one less thing for a proxy or CDN to mishandle.

**How it looks:** a form URL serves the form on GET and accepts the submission on POST (`/users/:id/edit` does both). Destructive actions get their own endpoint, `POST /users/:id/delete`, rendered by `@ui.confirm` as a CSRF-protected form — never a link, because a GET delete can be fired by a prefetch or an <img> tag.
