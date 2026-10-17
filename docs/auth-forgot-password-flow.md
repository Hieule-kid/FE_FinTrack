# Forgot / reset password flow

```
/forgot-password (client form)
  → POST /api/auth/forgot-password          (BFF route, no auth)
    → auth-service POST /api/v1/auth/forgot-password
        always 200 — identical response whether or not the email exists
        (if it exists: store SHA-256(token), e-mail link <FRONTEND_ORIGIN>/reset-password?token=…)

/reset-password?token=… (server page → client form)
  → POST /api/auth/reset-password           (BFF route, no auth)
    → auth-service POST /api/v1/auth/reset-password
        200: password changed, token consumed, ALL refresh tokens revoked
        401: token unknown / already used / expired
```

## Security decisions
- **No account enumeration**: the forgot response never reveals whether the email is registered; delivery errors are logged server-side only.
- **Token hygiene**: 256-bit random, only the hash is stored, single-use, 30 min TTL (`PASSWORD_RESET_TTL_MINUTES`), only the newest link per user is valid.
- **Throttle**: one reset e-mail per account per 60 s (`PASSWORD_RESET_COOLDOWN_SECONDS`), to stop mail-bombing a victim.
- **Session revocation**: a successful reset signs out every device (refresh tokens deleted); access tokens die within 15 min.
- **Token in URL**: the reset page sends `Referrer-Policy: no-referrer`, is `noindex`, and strips the token from the address bar after reading it.
- `authService.resetPassword` passes `skipUnauthorized: true` — otherwise the backend's 401 for a bad token would trigger the global silent-logout interceptor.

## Local dev
With `MAIL_HOST` unset on auth-service no e-mail is sent; the link is logged at DEBUG (`[DEV ONLY] password reset link…`). Set `MAIL_HOST/PORT/USERNAME/PASSWORD/MAIL_FROM` (any SMTP provider) for real delivery.
