# Security Fixes - Action Plan

## 🚨 CRITICAL FIXES (Must do before ANY production use)

### Priority 1: State/Nonce Validation (2-3 hours)

**Problem:** No replay attack protection

**Solution:**
1. Set up Redis (or use database)
2. Modify `/api/lti/login/route.ts`:
   - Store state/nonce with 5-minute expiration
3. Modify `/api/lti/launch/route.ts`:
   - Validate state exists and hasn't been used
   - Validate nonce from JWT matches stored nonce
   - Delete state after use (single-use only)

**Files to modify:**
- `app/api/lti/login/route.ts`
- `app/api/lti/launch/route.ts`
- Create `app/lib/lti-state-store.ts`

---

### Priority 2: Remove Hardcoded URLs (30 minutes)

**Problem:** Deep linking return URL is hardcoded

**Solution:**
- Store return URL from deep linking request in session/database
- Retrieve and validate it when creating response

**Files to modify:**
- `app/api/lti/deep-linking/response/route.ts`
- `app/api/lti/launch/route.ts` (store deep linking context)

---

### Priority 3: Remove Fallback Secrets (10 minutes)

**Problem:** Insecure fallback if env var missing

**Solution:**
Replace all instances of:
```typescript
process.env.SOMETHING || 'fallback'
```

With:
```typescript
const something = process.env.SOMETHING;
if (!something) throw new Error('SOMETHING env var required');
```

**Files to modify:**
- `app/api/lti/launch/route.ts` (line 83)
- `app/api/lti/login/route.ts` (line 45)
- `app/api/lti/deep-linking/response/route.ts` (line 40, 76)

---

## ⚠️ HIGH PRIORITY (Should do before production)

### Priority 4: Add Rate Limiting (1-2 hours)

**Solution:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

Create middleware for LTI routes:
```typescript
// app/api/lti/[...]/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

---

### Priority 5: Harden Cookie Security (15 minutes)

**Changes needed in** `app/api/lti/launch/route.ts`:

```typescript
response.cookies.set('lti-session', sessionToken, {
  httpOnly: true,
  secure: true,  // Always, not conditional
  sameSite: 'none',  // Required for LTI
  maxAge: 3600,  // 1 hour instead of 24
  path: '/lti',  // Restrict to LTI routes
  // Add domain in production: domain: 'your-domain.com'
});
```

---

### Priority 6: Add HTML Sanitization (30 minutes)

**Install:**
```bash
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify
```

**Modify:** `app/lti/deep-linking/page.tsx`
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Replace line 76:
tempContainer.innerHTML = DOMPurify.sanitize(data.form);
```

---

### Priority 7: JWT Max Age Validation (15 minutes)

**Modify:** `app/lib/lti-auth.ts`

```typescript
const { payload } = await jwtVerify(token, JWKS, {
  issuer: config.issuer,
  audience: config.clientId,
  maxTokenAge: '5m',  // Add this
});

// Add iat validation
const now = Math.floor(Date.now() / 1000);
if (claims.iat > now + 60) {
  throw new LTIAuthError('Token issued in future', 'INVALID_IAT');
}
```

---

## 🔶 MEDIUM PRIORITY (Nice to have before production)

### Priority 8: Security Logging (30 minutes)

Add structured logging for:
- Failed auth attempts
- Successful launches
- Grade submissions
- Deep linking sessions

Create: `app/lib/security-logger.ts`

---

### Priority 9: CSRF Protection (1 hour)

Add CSRF token validation to deep linking response endpoint

---

### Priority 10: Better Error Handling (30 minutes)

Only show detailed errors in development:

```typescript
return NextResponse.json({
  error: 'Authentication failed',
  ...(process.env.NODE_ENV === 'development' && {
    details: error.message,
    code: error.code
  })
}, { status: 401 });
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Starting:
- [ ] Create a new branch: `git checkout -b security-fixes`
- [ ] Backup current code
- [ ] Set up Redis (for state storage) or plan to use MongoDB
- [ ] Have test Canvas instance ready

### Critical Fixes:
- [ ] Implement state/nonce storage and validation
- [ ] Remove hardcoded deep linking return URL
- [ ] Remove all fallback secrets
- [ ] Test LTI launch flow works

### High Priority:
- [ ] Add rate limiting
- [ ] Fix cookie security settings
- [ ] Add DOMPurify
- [ ] Add JWT max age validation
- [ ] Test all flows again

### Testing:
- [ ] Test normal LTI launch
- [ ] Test deep linking
- [ ] Test grade passback
- [ ] Test with invalid/expired tokens
- [ ] Test rate limiting works
- [ ] Test replay attack prevention

### Deployment:
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Run security scan
- [ ] Deploy to production
- [ ] Monitor for errors

---

## 🛠️ QUICK SETUP: Redis for State Storage

**Option 1: Upstash (Easiest for production)**
```bash
# Sign up at upstash.com
# Create Redis database
# Add to .env.local:
UPSTASH_REDIS_REST_URL=your_url
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Option 2: Use MongoDB (If you don't want Redis)**
```typescript
// Create TTL index in MongoDB for auto-expiration
const stateSchema = new Schema({
  state: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  data: { type: Object },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min TTL
});
```

**Option 3: Local Redis (Development only)**
```bash
# Install Redis locally
docker run -p 6379:6379 redis:alpine
```

---

## 📊 TIME ESTIMATES

| Task | Time | Priority |
|------|------|----------|
| State/Nonce validation | 2-3h | CRITICAL |
| Remove hardcoded URLs | 30m | CRITICAL |
| Remove fallback secrets | 10m | CRITICAL |
| Add rate limiting | 1-2h | HIGH |
| Cookie security | 15m | HIGH |
| HTML sanitization | 30m | HIGH |
| JWT validation | 15m | HIGH |
| Security logging | 30m | MEDIUM |
| CSRF protection | 1h | MEDIUM |
| Error handling | 30m | MEDIUM |
| **Total Minimum (Critical + High):** | **5-7 hours** | |
| **Total Complete:** | **7-10 hours** | |

---

## 🎯 MINIMUM FOR TESTING WITH CANVAS

If you want to test quickly but safely:

1. **DO THESE MINIMUM 3 FIXES (1 hour):**
   - Remove fallback secrets (10 min)
   - Fix cookie security (15 min)  
   - Add basic state validation using MongoDB with TTL (45 min)

2. **Test in sandbox only** - Not production
3. **Implement full fixes before real use**

---

## 📞 NEED HELP?

If you need assistance with any of these fixes:

1. State/nonce implementation is the most complex
2. Redis setup can be tricky
3. Testing replay attack prevention requires specific tools

Consider pairing with a security-focused developer for the critical fixes.

---

## ⚡ QUICK FIX SCRIPT

I can help you create the fixes. Want me to:

1. Create a `lti-state-store.ts` utility file?
2. Update the LTI routes with proper validation?
3. Add rate limiting configuration?
4. Create a migration guide?

Just let me know which fixes you want to implement first!
