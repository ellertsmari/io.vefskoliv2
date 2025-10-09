# Security Audit Report - Vefskolinn LTI Integration
**Date:** October 9, 2025  
**Scope:** LTI 1.3 Implementation  
**Status:** ⚠️ CRITICAL ISSUES FOUND - MUST FIX BEFORE PRODUCTION

---

## 🚨 CRITICAL VULNERABILITIES (Must Fix Immediately)

### 1. **State/Nonce Replay Attack Risk** - HIGH SEVERITY
**Location:** `app/api/lti/login/route.ts` and `app/api/lti/launch/route.ts`

**Issue:**
- State and nonce are generated but **NEVER validated** in the launch endpoint
- State is encoded in base64 but not stored anywhere for verification
- Nonce is sent to Canvas but never checked when receiving the id_token
- **Attack Vector:** Attacker can replay old tokens indefinitely

**Current Code:**
```typescript
// login/route.ts - generates state/nonce
const state = crypto.randomUUID();
const nonce = crypto.randomUUID();
// ... but never stores them

// launch/route.ts - receives state but doesn't validate it!
const state = body.get('state') as string;
// ... doesn't check if state is valid or already used
```

**Impact:** 
- Replay attacks possible
- Token reuse attacks
- No protection against CSRF

**Fix Required:**
```typescript
// In login endpoint: Store state/nonce with expiration
await redis.setex(`lti:state:${state}`, 300, JSON.stringify({nonce, timestamp}));

// In launch endpoint: Validate and consume state
const stateData = await redis.get(`lti:state:${state}`);
if (!stateData) throw new Error('Invalid or expired state');
await redis.del(`lti:state:${state}`); // Single use only

// Also validate nonce in JWT matches stored nonce
if (claims.nonce !== storedNonce) throw new Error('Nonce mismatch');
```

---

### 2. **Hardcoded Return URL in Deep Linking** - HIGH SEVERITY
**Location:** `app/api/lti/deep-linking/response/route.ts:82`

**Issue:**
```typescript
const returnUrl = 'https://canvas.instructure.com/courses/1/external_tools/retrieve';
// ^^^ HARDCODED! Should come from the original request
```

**Impact:**
- Deep linking will fail for different Canvas instances
- Could redirect to wrong Canvas instance
- Potential for open redirect if not validated

**Fix Required:**
```typescript
// Store the return URL from deep linking request
// Retrieve it when creating response
const returnUrl = storedDeepLinkingContext.returnUrl;
// Validate it's a Canvas URL before using
if (!returnUrl.startsWith(config.issuer)) {
  throw new Error('Invalid return URL');
}
```

---

### 3. **Fallback Secrets in Production** - CRITICAL SEVERITY
**Location:** `app/api/lti/launch/route.ts:83`

**Issue:**
```typescript
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret'  // ⚠️ DANGEROUS
);
```

**Impact:**
- If NEXTAUTH_SECRET is not set, uses predictable fallback
- Anyone can forge session tokens
- Complete authentication bypass possible

**Fix Required:**
```typescript
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error('NEXTAUTH_SECRET is required');
}
const encodedSecret = new TextEncoder().encode(secret);
```

---

## ⚠️ HIGH PRIORITY SECURITY ISSUES

### 4. **No Rate Limiting on LTI Endpoints**
**Location:** All `/api/lti/*` routes

**Issue:**
- No rate limiting on login, launch, or deep linking endpoints
- Vulnerable to brute force attacks
- Can be DoS'd easily

**Fix Required:**
Implement rate limiting using upstash/ratelimit or similar:
```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

const { success } = await ratelimit.limit(ip);
if (!success) return Response.json({error: 'Rate limited'}, {status: 429});
```

---

### 5. **Session Cookie Security Concerns**
**Location:** `app/api/lti/launch/route.ts:108-111, 125-128`

**Issues:**
```typescript
response.cookies.set('lti-session', sessionToken, {
  httpOnly: true,  // ✅ Good
  secure: process.env.NODE_ENV === 'production',  // ⚠️ Issue 1
  sameSite: 'none',  // ⚠️ Issue 2
  maxAge: 86400,  // ⚠️ Issue 3
});
```

**Problems:**
1. **Secure flag depends on NODE_ENV** - Should ALWAYS be true in production
2. **SameSite: 'none'** - Required for LTI but increases CSRF risk
3. **No Domain restriction** - Could leak to subdomains
4. **24 hour expiration** - Too long for LTI sessions

**Fix Required:**
```typescript
response.cookies.set('lti-session', sessionToken, {
  httpOnly: true,
  secure: true,  // Always true
  sameSite: 'none',  // Required for LTI
  maxAge: 3600,  // 1 hour max
  domain: 'your-domain.com',  // Restrict to your domain
  path: '/lti',  // Restrict to LTI routes only
});
```

---

### 6. **innerHTML Usage Without Sanitization**
**Location:** `app/lti/deep-linking/page.tsx:76`

**Issue:**
```typescript
tempContainer.innerHTML = data.form;  // ⚠️ XSS risk
```

**Impact:**
- Potential XSS if server response is compromised
- Should sanitize HTML before inserting

**Fix Required:**
```typescript
import DOMPurify from 'dompurify';
tempContainer.innerHTML = DOMPurify.sanitize(data.form);
```

---

### 7. **No JWT Expiration Validation**
**Location:** `app/lib/lti-auth.ts`

**Issue:**
- jwtVerify checks exp claim, but **no maximum age validation**
- Old tokens could still be valid if not expired
- No check for issued-at time (iat)

**Fix Required:**
```typescript
const { payload } = await jwtVerify(token, JWKS, {
  issuer: config.issuer,
  audience: config.clientId,
  maxTokenAge: '5m',  // Add this - tokens older than 5 min rejected
});

// Also check iat claim
const now = Math.floor(Date.now() / 1000);
if (claims.iat > now + 60) {  // Clock skew tolerance
  throw new LTIAuthError('Token issued in future', 'INVALID_IAT');
}
```

---

## 🔶 MEDIUM PRIORITY ISSUES

### 8. **Weak Password for LTI Users**
**Location:** `app/api/lti/launch/route.ts:40`

**Issue:**
```typescript
password: crypto.randomUUID(),  // Random but not hashed
```

**Problem:**
- Password is random UUID but what if user needs to login directly?
- Should be properly hashed even though it's random

**Recommendation:**
```typescript
import bcrypt from 'bcrypt';
const randomPassword = crypto.randomUUID();
const hashedPassword = await bcrypt.hash(randomPassword, 10);
user.password = hashedPassword;
```

---

### 9. **No CSRF Protection on Deep Linking Response**
**Location:** `app/api/lti/deep-linking/response/route.ts`

**Issue:**
- Accepts POST without CSRF token validation
- Could be vulnerable to CSRF attacks

**Fix:**
Add CSRF token validation or use the lti-session cookie

---

### 10. **Insufficient Logging for Security Events**
**Location:** All LTI routes

**Missing:**
- Failed authentication attempts not logged with details
- No audit trail for LTI launches
- No logging of grade submissions

**Add:**
```typescript
// Log security events
console.warn('LTI Auth Failed', {
  ip: request.ip,
  issuer: iss,
  error: error.code,
  timestamp: new Date().toISOString()
});
```

---

## ℹ️ LOW PRIORITY / INFORMATIONAL

### 11. **Error Messages Leak Information**
**Location:** Multiple endpoints

**Issue:**
Error messages return detailed information that could help attackers

**Example:**
```typescript
return NextResponse.json({ 
  error: 'LTI Authentication Failed',
  details: error.message,  // ⚠️ May leak internals
  code: error.code 
}, { status: 401 });
```

**Recommendation:**
Only return detailed errors in development mode

---

### 12. **No Content Security Policy (CSP)**
**Issue:** No CSP headers set
**Impact:** Increased XSS risk
**Fix:** Add CSP headers in middleware or next.config.js

---

### 13. **No Input Validation on Guide Selection**
**Location:** `app/api/lti/deep-linking/response/route.ts`

**Issue:**
```typescript
const { selectedGuides } = await request.json();
// Basic validation exists but could be stricter
```

**Current validation is good but add:**
- Check guides actually exist in database
- Verify user has permission to select these guides
- Limit number of guides per request

---

## 📋 SECURITY CHECKLIST FOR PRODUCTION

### Before Deploying:

- [ ] **CRITICAL:** Implement state/nonce validation with Redis
- [ ] **CRITICAL:** Remove all hardcoded URLs (deep linking return URL)
- [ ] **CRITICAL:** Remove fallback secrets
- [ ] **HIGH:** Add rate limiting to all LTI endpoints
- [ ] **HIGH:** Fix cookie security settings
- [ ] **HIGH:** Add DOMPurify for HTML sanitization
- [ ] **HIGH:** Add JWT max age validation
- [ ] **MEDIUM:** Ensure all passwords are hashed
- [ ] **MEDIUM:** Add CSRF protection
- [ ] **MEDIUM:** Implement security event logging
- [ ] Set up security monitoring/alerts
- [ ] Enable HTTPS only (no HTTP)
- [ ] Configure Content Security Policy
- [ ] Add security headers (X-Frame-Options, etc.)
- [ ] Set up WAF rules
- [ ] Enable request logging
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Run penetration testing
- [ ] Review all environment variables
- [ ] Ensure `.env.local` is in .gitignore (✅ already done)
- [ ] Set up automated security scanning

---

## 🛠️ RECOMMENDED DEPENDENCIES

Add these for security improvements:

```bash
npm install @upstash/ratelimit @upstash/redis
npm install dompurify
npm install helmet  # For security headers
```

---

## 🔒 .gitignore Status

✅ **GOOD:** Your `.gitignore` properly excludes:
- `.env*.local` files
- `*.pem` files (private keys)
- Node modules
- Build artifacts

---

## 📊 RISK ASSESSMENT

| Category | Risk Level | Status |
|----------|-----------|--------|
| Authentication | 🔴 HIGH | State/nonce not validated |
| Session Management | 🟡 MEDIUM | Cookie settings need hardening |
| Input Validation | 🟢 LOW | Generally good |
| Cryptography | 🟡 MEDIUM | Fallback secrets exist |
| Rate Limiting | 🔴 HIGH | Not implemented |
| Logging | 🟡 MEDIUM | Insufficient security logging |
| XSS Protection | 🟡 MEDIUM | Some innerHTML usage |
| Overall | 🔴 HIGH | **NOT PRODUCTION READY** |

---

## 🚀 IMMEDIATE ACTION REQUIRED

**Do NOT deploy to production until:**

1. State/nonce validation is implemented (Use Redis or database)
2. Hardcoded return URL is replaced with dynamic value from request
3. Fallback secrets are removed
4. Rate limiting is added
5. Cookie security is hardened
6. Security testing is performed

**Estimated Time to Fix Critical Issues:** 4-8 hours

---

## 📚 RECOMMENDED READING

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [IMS LTI Security Framework](https://www.imsglobal.org/spec/security/v1p0/)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/configuring/content-security-policy)
- [Canvas LTI Security Guidelines](https://canvas.instructure.com/doc/api/file.oauth.html)

---

**Report Prepared By:** Security Audit - Automated Analysis  
**Next Review Date:** After fixes are implemented  
**Contact:** Review this report before production deployment
