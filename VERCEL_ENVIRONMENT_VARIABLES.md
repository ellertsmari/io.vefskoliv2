# Vercel Environment Variables Setup

**Required for Production Deployment on Vercel**

Copy these environment variables to your Vercel project settings:

---

## Required Variables

### 1. Database
```
MONGODB_CONNECTION=your_production_mongodb_connection_string
```

### 2. Authentication (NextAuth)
```
AUTH_SECRET=your_production_auth_secret
NEXTAUTH_URL=https://io.vefskoli.is
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Zoom Integration
```
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
```

### 4. LTI Configuration
```
LTI_ISSUER=https://canvas.instructure.com
LTI_KEY_SET_URL=https://canvas.instructure.com/api/lti/security/jwks
LTI_AUTH_TOKEN_URL=https://canvas.instructure.com/login/oauth2/token
LTI_AUTH_LOGIN_URL=https://canvas.instructure.com/api/lti/authorize_redirect
```

### 5. LTI Canvas Credentials
```
LTI_CLIENT_ID=your_client_id_from_canvas_developer_key
LTI_DEPLOYMENT_ID=your_deployment_id_from_canvas
```

### 6. LTI Key Configuration
```
LTI_KEY_ID=lms-key-1
```

### 7. LTI RSA Keys
```
LTI_TOOL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDne0qLGsZvjyGr
... [COPY YOUR FULL PRIVATE KEY FROM .env.local] ...
-----END PRIVATE KEY-----"

LTI_TOOL_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA53tKixrGb48hq/0/Neo7
... [COPY YOUR FULL PUBLIC KEY FROM .env.local] ...
-----END PUBLIC KEY-----"
```

---

## How to Add to Vercel

### Via Vercel Dashboard (Recommended)
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable one by one
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

### Via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Add each environment variable
vercel env add MONGODB_CONNECTION production
vercel env add AUTH_SECRET production
vercel env add NEXTAUTH_URL production
# ... continue for all variables
```

### Via .env File Import (Easiest)
1. Copy your `.env.local` file to `.env.production.local`
2. Go to Vercel Dashboard → Project → Settings → Environment Variables
3. Click **Import .env File** at the top
4. Upload `.env.production.local`
5. Select **Production** environment
6. Click **Import**

⚠️ **IMPORTANT:** Delete `.env.production.local` after importing to Vercel!

---

## Environment-Specific Notes

### Production Environment
- Use production MongoDB connection string
- Set `NEXTAUTH_URL=https://io.vefskoli.is`
- Use same RSA keys from your `.env.local` (they must match Canvas Developer Key)

### Preview Environment
- Can use same settings as production OR separate test Canvas instance
- Consider using a separate Canvas Developer Key for testing

### Development Environment
- Usually not needed in Vercel (you use `.env.local` locally)
- But can be set if you deploy development branches

---

## Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Use strong, unique secrets for `AUTH_SECRET` and `NEXTAUTH_SECRET`
- [ ] Rotate secrets if they are ever exposed
- [ ] Use Vercel's encrypted storage (automatic)
- [ ] Limit Vercel project access to authorized team members
- [ ] Keep RSA keys consistent between local dev and production

---

## After Deploying to Vercel

1. **Update Canvas Developer Key** with production URL:
   - Redirect URI: `https://io.vefskoli.is/api/lti/launch`
   - Login URL: `https://io.vefskoli.is/api/lti/login`
   - JWK URL: `https://io.vefskoli.is/api/lti/jwks`

2. **Test the integration**:
   - Access your app from Canvas
   - Verify LTI launch works
   - Test grade passback
   - Test deep linking

3. **Monitor Vercel logs** for any environment variable issues

---

## Quick Copy List (for manual entry)

Total: **17 environment variables**

1. MONGODB_CONNECTION
2. AUTH_SECRET
3. NEXTAUTH_URL
4. NEXTAUTH_SECRET
5. ZOOM_ACCOUNT_ID
6. ZOOM_CLIENT_ID
7. ZOOM_CLIENT_SECRET
8. LTI_ISSUER
9. LTI_KEY_SET_URL
10. LTI_AUTH_TOKEN_URL
11. LTI_AUTH_LOGIN_URL
12. LTI_CLIENT_ID
13. LTI_DEPLOYMENT_ID
14. LTI_KEY_ID
15. LTI_TOOL_PRIVATE_KEY
16. LTI_TOOL_PUBLIC_KEY

---

## Troubleshooting

**Q: "Invalid client_id" error in Canvas**
- Verify `LTI_CLIENT_ID` matches exactly what Canvas shows in Developer Key

**Q: "Invalid deployment_id" error**
- Verify `LTI_DEPLOYMENT_ID` matches Canvas deployment

**Q: "JWT verification failed"**
- Ensure RSA keys in Vercel match the public key in Canvas Developer Key

**Q: Environment variables not updating**
- Redeploy after changing environment variables
- Clear Vercel cache if needed
