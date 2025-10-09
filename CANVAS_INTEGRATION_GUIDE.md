# Quick Start: Canvas Integration Guide

This is your step-by-step checklist for integrating Vefskolinn with Canvas LMS.

## Prerequisites

- [ ] Access to Canvas as an Administrator
- [ ] Your Vefskolinn application deployed and accessible (e.g., `https://vefskolinn.example.com`)
- [ ] SSL certificate installed (HTTPS required)

## Step 1: Generate RSA Key Pair (5 minutes)

On your server or local machine:

```bash
# Generate private key (you'll be asked for a passphrase - remember it!)
openssl genpkey -algorithm RSA -out private_key.pem -pkcs8 -outform PEM

# Extract public key
openssl rsa -in private_key.pem -pubout -out public_key.pem

# View the keys
cat private_key.pem
cat public_key.pem
```

**Save these keys securely!** You'll need them in the next step.

## Step 2: Configure Environment Variables (10 minutes)

Create or update `.env.local` in your project root:

```bash
# MongoDB Connection (if not already set)
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.com

# LTI Configuration - Canvas URLs
LTI_ISSUER=https://canvas.instructure.com
LTI_KEY_SET_URL=https://canvas.instructure.com/api/lti/security/jwks
LTI_AUTH_TOKEN_URL=https://canvas.instructure.com/login/oauth2/token
LTI_AUTH_LOGIN_URL=https://canvas.instructure.com/api/lti/authorize_redirect

# LTI Keys (paste your generated keys here)
LTI_TOOL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...
...paste your entire private key here...
-----END PRIVATE KEY-----"

LTI_TOOL_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu4...
...paste your entire public key here...
-----END PUBLIC KEY-----"

LTI_KEY_ID=vefskolinn-key-1

# These will be filled in after Canvas configuration
LTI_CLIENT_ID=
LTI_DEPLOYMENT_ID=
```

**Note:** Don't commit this file! Make sure `.env.local` is in your `.gitignore`.

## Step 3: Deploy Your Application (if not already deployed)

```bash
# Build the application
npm run build

# Start the production server
npm start
```

Your application should now be accessible at your domain.

## Step 4: Register Tool in Canvas (15 minutes)

### A. Access Developer Keys

1. Log into Canvas as an Administrator
2. Go to **Admin** → **Developer Keys**
3. Click **+ Developer Key** → **+ LTI Key**

### B. Configure the Tool

Fill in the following fields:

**Key Settings:**
- **Key Name:** `Vefskolinn LMS`
- **Owner Email:** `your-email@example.com`
- **Redirect URIs:** `https://your-domain.com/api/lti/launch`
- **Method:** `Manual Entry`
- **Title:** `Vefskolinn LMS`
- **Description:** `Interactive web development learning platform`
- **Target Link URI:** `https://your-domain.com/api/lti/launch`
- **OpenID Connect Initiation Url:** `https://your-domain.com/api/lti/login`
- **JWK Method:** `Public JWK URL`
- **Public JWK URL:** `https://your-domain.com/api/lti/jwks`

**Configure Scopes** - Select these checkboxes:
- ✅ `Can create and view assignment data in the gradebook associated with the tool` (AGS Line Item)
- ✅ `Can view assignment data in the gradebook associated with the tool` (AGS Result)
- ✅ `Can create and update assignment data in the gradebook associated with the tool` (AGS Score)
- ✅ `Can retrieve user data associated with the context the tool is installed in` (NRPS)

**Configure Placements:**

Click **+ Placement** and add:

1. **Course Navigation** (Main menu item):
   - Label: `Vefskolinn`
   - Target Link URI: `https://your-domain.com/api/lti/launch`
   - Icon URL: `https://your-domain.com/icon` (optional)

2. **Assignment Selection** (For deep linking):
   - Label: `Select Vefskolinn Guide`
   - Target Link URI: `https://your-domain.com/lti/deep-linking`
   - Message Type: `LtiDeepLinkingRequest`

### C. Save and Enable

1. Click **Save**
2. Find your newly created key in the list
3. Toggle it from **OFF** to **ON**
4. Click on the key to view details
5. **Copy the Client ID** - you'll need this!

### D. Note Your Deployment ID

1. After enabling, you may see a Deployment ID
2. If not immediately visible, it will appear when you install the tool in a course

## Step 5: Update Environment Variables with Canvas Info

Update your `.env.local` with the values from Canvas:

```bash
# Add these values from Step 4
LTI_CLIENT_ID=125900000000000001
LTI_DEPLOYMENT_ID=1  # Or the actual deployment ID from Canvas
```

**Restart your application** for changes to take effect:

```bash
# If using PM2
pm2 restart vefskolinn

# If using systemd
sudo systemctl restart vefskolinn

# If running directly
# Stop the server (Ctrl+C) and run npm start again
```

## Step 6: Install Tool in a Canvas Course (5 minutes)

### Test Course Installation

1. Go to a Canvas course (use a test course first!)
2. Click **Settings** → **Apps** tab
3. Click **View App Configurations**
4. Click **+ App**
5. Configuration Type: **By Client ID**
6. Enter your **Client ID** from Step 4
7. Click **Submit**

The tool is now installed in your course!

## Step 7: Test the Integration (10 minutes)

### Test 1: Basic Launch
1. In your Canvas course, look for **Vefskolinn** in the course navigation menu
2. Click it
3. You should be redirected to Vefskolinn and automatically logged in
4. ✅ Success if you see the Vefskolinn dashboard

### Test 2: Deep Linking (Content Selection)
1. In Canvas, create a new **Assignment**
2. Submission Type: Select **External Tool**
3. Click **Find** button
4. Select **Vefskolinn** from the list
5. You should see a guide selection interface
6. Select one or more guides
7. Click submit
8. ✅ Success if the assignment is created with the selected content

### Test 3: Grade Passback
1. As a student, access the assignment created in Test 2
2. Complete the guide/assignment
3. As a teacher in Vefskolinn, submit a grade
4. Go back to Canvas gradebook
5. ✅ Success if the grade appears in Canvas

## Troubleshooting

### "Invalid Client ID" Error
- Double-check `LTI_CLIENT_ID` in `.env.local` matches Canvas
- Make sure you restarted your application after updating

### "Token Verification Failed"
- Verify your private key is correctly formatted in `.env.local`
- Ensure no extra spaces or line breaks in the key
- Check that the public key is accessible at `/api/lti/jwks`

### "Tool Not Showing in Course Navigation"
- Make sure the Developer Key is **ON** in Canvas
- Check that Course Navigation placement was configured
- Try refreshing the Canvas page or clearing cache

### "Deep Linking Not Working"
- Verify Assignment Selection placement is configured
- Check Target Link URI points to `/lti/deep-linking`
- Ensure Message Type is `LtiDeepLinkingRequest`

### Check Your Configuration

Visit these URLs to verify endpoints are working:

- `https://your-domain.com/api/lti/jwks` - Should return JSON with public key
- Check application logs for LTI-related errors

### Enable Debug Logging

Add to `.env.local`:
```bash
NODE_ENV=development
```

Then check your application logs for detailed LTI debugging information.

## Production Checklist

Before going live:

- [ ] SSL certificate installed and working (HTTPS)
- [ ] Environment variables set correctly
- [ ] Private key secured (not in version control)
- [ ] Application restarted after configuration
- [ ] Developer Key enabled in Canvas
- [ ] Tool installed and tested in a course
- [ ] Tested with student and teacher accounts
- [ ] Grade passback working correctly
- [ ] Error monitoring in place
- [ ] Backups configured

## Getting Help

If you run into issues:

1. Check the detailed `LTI_SETUP.md` file
2. Review Canvas LTI documentation: https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html
3. Check IMS Global LTI 1.3 spec: https://www.imsglobal.org/spec/lti/v1p3/
4. Review your application logs for specific error messages

## Next Steps

Once integration is working:

1. **Configure Multiple Courses:** Install the tool in additional Canvas courses
2. **Customize Placements:** Adjust which placements you want enabled
3. **Set up Analytics:** Monitor tool usage and student engagement
4. **Train Teachers:** Create documentation for instructors
5. **Monitor Performance:** Watch for any grade sync issues

## Support

For Vefskolinn-specific issues, check the project repository or contact your development team.
