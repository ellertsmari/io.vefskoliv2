# LTI Integration Flow Diagram

## Overview: How Canvas Talks to Vefskolinn

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LTI 1.3 Integration Flow                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐                                      ┌──────────────┐
│              │                                      │              │
│   Canvas     │                                      │  Vefskolinn  │
│   LMS        │                                      │     LMS      │
│              │                                      │              │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       │ 1. User clicks "Vefskolinn" in course menu         │
       │─────────────────────────────────────────────────────>
       │    POST /api/lti/login                              │
       │    (iss, login_hint, target_link_uri)              │
       │                                                     │
       │ 2. Login initiation                                 │
       │<─────────────────────────────────────────────────────
       │    Redirect to Canvas authorize                     │
       │    (with state, nonce)                              │
       │                                                     │
       │ 3. Canvas authenticates user internally             │
       │    and creates JWT token                            │
       │                                                     │
       │ 4. POST to launch endpoint with id_token            │
       │─────────────────────────────────────────────────────>
       │    POST /api/lti/launch                             │
       │    (id_token with user info, context, roles)        │
       │                                                     │
       │                                    5. Vefskolinn:   │
       │                                    - Validates JWT  │
       │                                    - Creates user   │
       │                                    - Stores context │
       │                                    - Creates session│
       │                                                     │
       │ 6. Redirect to LMS dashboard                        │
       │<─────────────────────────────────────────────────────
       │    User now logged in & using Vefskolinn            │
       │                                                     │
```

## Deep Linking Flow (Content Selection)

```
┌──────────────┐                                      ┌──────────────┐
│   Canvas     │                                      │  Vefskolinn  │
│   Teacher    │                                      │              │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       │ 1. Teacher creates assignment                       │
       │    Selects "External Tool"                          │
       │    Clicks "Find" → Selects Vefskolinn              │
       │                                                     │
       │ 2. Deep Linking Request                             │
       │─────────────────────────────────────────────────────>
       │    POST /lti/deep-linking                           │
       │    (JWT with deep linking context)                  │
       │                                                     │
       │                                    3. Show guide    │
       │                                       selection UI  │
       │                                                     │
       │ 4. Teacher selects guides                           │
       │─────────────────────────────────────────────────────>
       │    POST /api/lti/deep-linking/response              │
       │    (selected guide IDs)                             │
       │                                                     │
       │                                    5. Create JWT    │
       │                                       with content  │
       │                                       items         │
       │                                                     │
       │ 6. Deep Linking Response (auto-submit form)         │
       │<─────────────────────────────────────────────────────
       │    JWT with selected content                        │
       │                                                     │
       │ 7. Canvas creates assignment                        │
       │    with embedded Vefskolinn content                 │
       │                                                     │
```

## Grade Passback Flow

```
┌──────────────┐                                      ┌──────────────┐
│   Canvas     │                                      │  Vefskolinn  │
│  Gradebook   │                                      │              │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       │                                    1. Student       │
       │                                       completes     │
       │                                       assignment    │
       │                                                     │
       │                                    2. Teacher       │
       │                                       grades in     │
       │                                       Vefskolinn    │
       │                                                     │
       │ 3. Grade submission request                         │
       │<─────────────────────────────────────────────────────
       │    POST /api/lti/grades                             │
       │    (OAuth token request)                            │
       │                                                     │
       │ 4. Return access token                              │
       │─────────────────────────────────────────────────────>
       │    (OAuth2 access token)                            │
       │                                                     │
       │ 5. Submit score                                     │
       │<─────────────────────────────────────────────────────
       │    POST to Canvas AGS endpoint                      │
       │    (score, userId, timestamp, etc.)                 │
       │                                                     │
       │ 6. Grade appears in Canvas gradebook               │
       │                                                     │
```

## Security: JWT Token Validation

```
┌──────────────────────────────────────────────────────────────────┐
│                    JWT Token Validation                           │
└──────────────────────────────────────────────────────────────────┘

Canvas creates JWT ──────> Vefskolinn receives JWT
       │                           │
       │                           ▼
       │                    1. Get Canvas public key
       │                       from JWKS endpoint
       │                           │
       │                           ▼
       │                    2. Verify signature
       │                       using public key
       │                           │
       │                           ▼
       │                    3. Check claims:
       │                       - Issuer (iss)
       │                       - Audience (aud)
       │                       - Expiration (exp)
       │                       - Deployment ID
       │                           │
       │                           ▼
       │                    4. Extract user data:
       │                       - User ID
       │                       - Email
       │                       - Roles
       │                       - Context
       │                           │
       │                           ▼
       │                    5. Create/update user
       │                       in Vefskolinn DB
       │                           │
       │                           ▼
       │                    6. Create session
       │                       & redirect to app
```

## Key Endpoints Reference

### Vefskolinn Endpoints (Your App)
```
GET  /api/lti/jwks              → Public key (JWKS format)
POST /api/lti/login             → LTI login initiation
POST /api/lti/launch            → LTI resource link launch
GET  /lti/deep-linking          → Content selection UI
POST /api/lti/deep-linking/response → Deep link response
POST /api/lti/grades            → Grade submission
```

### Canvas Endpoints (Used by Vefskolinn)
```
GET  /api/lti/security/jwks     → Canvas public keys
POST /login/oauth2/token        → OAuth token for API
POST /api/lti/authorize_redirect → Authorization endpoint
POST [AGS endpoint]             → Grade submission
```

## Data Flow

### User Data Stored in Vefskolinn

```javascript
{
  userId: "canvas-user-id",
  email: "student@example.com",
  name: "John Doe",
  role: "student", // or "teacher"
  ltiId: "canvas-lti-id"
}
```

### LTI Launch Context Stored

```javascript
{
  userId: "canvas-user-id",
  contextId: "canvas-course-123",
  resourceLinkId: "assignment-456",
  deploymentId: "deployment-1",
  issuer: "https://canvas.instructure.com",
  lineitemsUrl: "https://canvas.../line_items",
  lineitemUrl: "https://canvas.../line_items/123",
  roles: ["Learner"],
  lastAccessed: "2025-10-09T..."
}
```

### Grade Data Sent to Canvas

```javascript
{
  userId: "canvas-user-id",
  scoreGiven: 85,
  scoreMaximum: 100,
  comment: "Great work!",
  timestamp: "2025-10-09T...",
  activityProgress: "Completed",
  gradingProgress: "FullyGraded"
}
```

## Configuration Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                     What Needs What                          │
└─────────────────────────────────────────────────────────────┘

Your Domain URL ──────────> All endpoint URLs
                             (login, launch, jwks, etc.)

RSA Key Pair ──────────────> Private Key (sign JWTs)
                             Public Key (verify from Canvas)

Canvas Developer Key ─────> Client ID
                             Deployment ID

All of above ──────────────> .env.local configuration

.env.local ────────────────> Application restart required!
```

## Troubleshooting Flow

```
Issue: "Tool not working"
         │
         ▼
Check 1: Is HTTPS working? ───No──> Fix SSL certificate
         │ Yes
         ▼
Check 2: Dev Key enabled? ────No──> Enable in Canvas Admin
         │ Yes
         ▼
Check 3: .env.local correct? ─No──> Update environment vars
         │ Yes                        & restart app
         ▼
Check 4: /api/lti/jwks works? No──> Check app deployment
         │ Yes
         ▼
Check 5: Check app logs for specific error
```

## Summary

**Prerequisites:**
1. SSL certificate (HTTPS)
2. RSA key pair generated
3. Application deployed
4. Canvas admin access

**Configuration Steps:**
1. Set environment variables
2. Create Developer Key in Canvas
3. Configure placements
4. Install in course
5. Test all three flows

**Three Main Flows:**
1. **Launch**: User authentication & access
2. **Deep Linking**: Content selection
3. **Grade Passback**: Sync grades to Canvas

**Key Security Points:**
- All communication over HTTPS
- JWTs signed and verified
- OAuth tokens for API access
- Private key never shared
