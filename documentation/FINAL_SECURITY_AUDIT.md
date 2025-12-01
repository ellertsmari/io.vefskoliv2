# Final Security Audit Report - LTI Integration

**Date:** October 9, 2025  
**Auditor:** Security Review  
**Status:** 🟡 1 Medium Priority Issue Found

---

## Executive Summary

A comprehensive security audit was conducted on the LTI 1.3 integration. The previous critical and high-priority vulnerabilities have been successfully resolved. However, **one medium-priority issue** was identified that should be addressed before production deployment.

---

## ✅ Previously Fixed Vulnerabilities (All Resolved)

### 1. ✅ State/Nonce Replay Attack Prevention - RESOLVED
- **Status:** Fixed
- **Implementation:** MongoDB-backed state storage with TTL, single-use validation
- **Location:** `app/lib/lti-state-store.ts`, `app/api/lti/login/route.ts`, `app/api/lti/launch/route.ts`

### 2. ✅ Fallback Secrets - RESOLVED
- **Status:** Fixed
- **Implementation:** All fallback values removed, throws errors if env vars missing
- **Affected Variables:** `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `LTI_KEY_ID`

### 3. ✅ Cookie Security - RESOLVED
- **Status:** Fixed
- **Implementation:** Hardened cookie settings (secure, httpOnly, path-restricted, 1-hour expiration)

### 4. ✅ Deep Linking Open Redirect - RESOLVED
- **Status:** Fixed
- **Implementation:** Return URL extracted from JWT claims and validated against issuer origin

### 5. ✅ JWT Max Age Validation - RESOLVED
- **Status:** Fixed
- **Implementation:** 5-minute max age with 30-second clock skew tolerance

---

## 🟡 Current Security Issues

### Issue #1: Unhashed Password for LTI Users (MEDIUM PRIORITY)

**Severity:** MEDIUM  
**Risk Level:** Medium  
**CVSS Score:** 5.3 (Medium)

#### Description
When creating new users via LTI authentication, passwords are generated using `crypto.randomUUID()` but stored in the database **without hashing**. While these passwords are randomly generated and not known to users, storing unhashed passwords violates security best practices and poses risks if the database is compromised.

#### Affected Code
```typescript
// app/api/lti/launch/route.ts, line 59
user = new User({
  name: userInfo.name,
  email: userInfo.email,
  password: crypto.randomUUID(), // ⚠️ NOT HASHED
  role: userRole,
  ltiId: userInfo.id,
  createdAt: new Date(),
});
```

#### Security Impact
- **Database Compromise:** If database is breached, passwords are exposed in plaintext
- **Compliance:** Violates password storage best practices (OWASP, NIST guidelines)
- **Lateral Movement:** Attacker could potentially use these credentials if users reuse patterns
- **Audit Failure:** Would fail security compliance audits (PCI-DSS, SOC 2, etc.)

#### Recommendation
Hash the password before storing, consistent with the signup flow:

```typescript
import bcrypt from 'bcrypt';

// Generate a secure random password and hash it
const randomPassword = crypto.randomUUID();
const hashedPassword = await bcrypt.hash(randomPassword, 10);

user = new User({
  name: userInfo.name,
  email: userInfo.email,
  password: hashedPassword, // ✅ HASHED
  role: userRole,
  ltiId: userInfo.id,
  createdAt: new Date(),
});
```

#### Remediation Priority
**Medium** - Should be fixed before production deployment, but not immediately critical since:
- Passwords are randomly generated (not user-chosen)
- Passwords are not communicated to users
- LTI users authenticate via Canvas, not with these passwords
- Risk is limited to database breach scenarios

---

## 🟢 Security Strengths Verified

### Authentication & Authorization
- ✅ **JWT Signature Verification:** Properly validates JWT signatures using Canvas JWKS
- ✅ **Issuer/Audience Validation:** Correctly validates `iss` and `aud` claims
- ✅ **Deployment ID Validation:** Ensures deployment ID matches configuration
- ✅ **Token Expiration:** Enforces 5-minute max age with clock skew tolerance
- ✅ **State/Nonce Flow:** Implements proper OIDC state/nonce validation

### Session Management
- ✅ **Cookie Security:** httpOnly, secure, sameSite, path-restricted
- ✅ **Session Expiration:** 1-hour timeout (reasonable for LTI context)
- ✅ **Session Token:** JWT-based with proper claims

### Input Validation
- ✅ **Deep Linking Guide IDs:** Validates ObjectId format and array length (max 50)
- ✅ **Score Validation:** Validates score ranges in grading endpoint
- ✅ **URL Validation:** Validates deep linking return URL origin
- ✅ **Required Parameters:** Checks for missing required fields

### Data Protection
- ✅ **XSS Prevention:** HTML escaping in deep linking response form
- ✅ **No Sensitive Data Logging:** Error messages don't expose sensitive information
- ✅ **TTL Indexes:** Automatic cleanup of expired state documents

### Configuration Security
- ✅ **No Hardcoded Secrets:** All secrets loaded from environment variables
- ✅ **Fail Fast:** Application refuses to start without required configuration
- ✅ **Private Key Protection:** Private keys loaded from env, not committed to repo

---

## ⚠️ Additional Recommendations (Nice-to-Have)

### 1. Rate Limiting (LOW PRIORITY)
**Current State:** No rate limiting implemented  
**Recommendation:** Add rate limiting to prevent abuse
```typescript
// Consider adding middleware for LTI endpoints
// Example: 10 requests per minute per IP
```
**Impact:** Prevents brute force and DoS attacks  
**Priority:** LOW - Can be added as enhancement

### 2. Request Size Limits (LOW PRIORITY)
**Current State:** Uses Next.js default limits  
**Recommendation:** Explicitly configure body size limits for LTI endpoints
```typescript
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
```
**Impact:** Prevents DoS via large payloads  
**Priority:** LOW - Next.js defaults are reasonable

### 3. CORS Configuration Review (INFO)
**Current State:** Relies on Next.js defaults and `sameSite: 'none'`  
**Recommendation:** Verify CORS headers are appropriate for Canvas integration  
**Priority:** INFO - Appears correct for LTI use case

### 4. Audit Logging (ENHANCEMENT)
**Current State:** Console logging for errors  
**Recommendation:** Add structured audit logs for:
- Failed authentication attempts
- State validation failures
- Unauthorized access attempts
- Grade submissions
**Priority:** ENHANCEMENT - Good for compliance and monitoring

### 5. Security Headers (INFO)
**Current State:** Next.js defaults  
**Recommendation:** Verify security headers in production:
- `X-Frame-Options` (should allow Canvas embedding)
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
**Priority:** INFO - Check production deployment

---

## Compliance Checklist

### LTI 1.3 Security Requirements
- ✅ OIDC authentication flow implemented
- ✅ JWT signature verification
- ✅ State parameter validation
- ✅ Nonce validation
- ✅ Platform key set validation
- ✅ Message type validation
- ✅ Deployment ID validation
- ⚠️ Secure credential storage (password hashing needed)

### OWASP Top 10 (2021)
- ✅ A01:2021 - Broken Access Control (Role-based access implemented)
- ✅ A02:2021 - Cryptographic Failures (JWT validation, but see password issue)
- ✅ A03:2021 - Injection (Input validation, parameterized queries)
- ✅ A04:2021 - Insecure Design (Secure by design, state management)
- ✅ A05:2021 - Security Misconfiguration (No fallback secrets)
- ✅ A06:2021 - Vulnerable Components (Dependencies up to date)
- ✅ A07:2021 - Authentication Failures (Strong authentication via Canvas)
- ⚠️ A08:2021 - Software/Data Integrity (Password hashing needed)
- ✅ A09:2021 - Logging Failures (Error logging present)
- ✅ A10:2021 - SSRF (URL validation implemented)

---

## Testing Recommendations

### Security Testing
1. **Penetration Testing:** Consider third-party security audit
2. **Token Replay Testing:** Verify state/nonce prevents replay
3. **Session Testing:** Test cookie security and expiration
4. **Authorization Testing:** Verify role-based access controls

### Integration Testing
1. **Canvas Integration:** Full end-to-end test with Canvas instance
2. **Deep Linking:** Test content selection and return flow
3. **Grade Passback:** Verify grade submission to Canvas
4. **Error Scenarios:** Test expired tokens, invalid state, etc.

---

## Action Items

### Before Production Deployment

| Priority | Item | Effort | Owner |
|----------|------|--------|-------|
| 🟡 MEDIUM | Hash LTI user passwords | 15 min | Backend |
| 🟢 LOW | Add rate limiting | 2 hours | Backend |
| 🟢 LOW | Configure explicit body size limits | 30 min | Backend |
| 🟢 INFO | Review security headers | 1 hour | DevOps |
| 🟢 INFO | Set up audit logging | 3 hours | Backend |

### Post-Deployment

| Priority | Item | Effort |
|----------|------|--------|
| 🟢 ENHANCEMENT | Penetration testing | External |
| 🟢 ENHANCEMENT | Security monitoring | 5 hours |
| 🟢 ENHANCEMENT | Automated security scans | 2 hours |

---

## Conclusion

The LTI integration demonstrates **strong security practices** with only one medium-priority issue remaining. The previous critical vulnerabilities have been successfully mitigated:

- ✅ No state/nonce replay attacks possible
- ✅ No fallback secrets in production
- ✅ Cookies properly secured
- ✅ Open redirect vulnerability closed
- ✅ JWT validation comprehensive

**Recommendation:** Fix the password hashing issue (15-minute effort) before production deployment. The system is otherwise production-ready from a security perspective.

---

## References

- [LTI 1.3 Security Specification](https://www.imsglobal.org/spec/security/v1p0/)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Next Step:** Implement password hashing for LTI users (see recommendation above).
