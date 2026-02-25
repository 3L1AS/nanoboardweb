# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security
- Require `JWT_SECRET` at server startup (removed insecure hardcoded fallback secret).
- Add login rate limiting and temporary lockout for repeated failed password attempts.
- Use constant-time password comparison in login flow.
- Restrict API and Socket.IO CORS behavior (no wildcard `*` default in production).
- Disable Express `X-Powered-By` header.
- Fix path traversal protections in filesystem routes using canonical path validation.
- Fix path traversal vulnerabilities in session and skill routes (`:id` and save/delete flows).
- Sanitize skill names before saving files.
- Stop returning raw internal exception strings to API clients; log server-side and return generic errors.

### Docs
- Update Docker/deployment guidance to require `JWT_SECRET` and recommend HTTPS reverse proxy deployment.
