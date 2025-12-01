# LTI 1.3 Integration Setup

This document provides instructions for setting up LTI 1.3 integration between your LMS and Canvas.

## Overview

The LTI integration allows:
- Students to access LMS content directly from Canvas
- Teachers to add LMS guides to Canvas courses
- Automatic grade passback from LMS to Canvas gradebook
- Single sign-on between Canvas and LMS

## Required Environment Variables

Add these variables to your `.env.local` file:

```bash
# LTI Configuration
LTI_ISSUER=https://canvas.instructure.com
LTI_CLIENT_ID=your_client_id_from_canvas
LTI_DEPLOYMENT_ID=your_deployment_id_from_canvas
LTI_KEY_SET_URL=https://canvas.instructure.com/api/lti/security/jwks
LTI_AUTH_TOKEN_URL=https://canvas.instructure.com/login/oauth2/token
LTI_AUTH_LOGIN_URL=https://canvas.instructure.com/api/lti/authorize_redirect

# Tool Key Configuration
LTI_TOOL_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_private_key_here
-----END PRIVATE KEY-----"

LTI_TOOL_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
your_public_key_here
-----END PUBLIC KEY-----"

LTI_KEY_ID=lms-key-1

# Your app URL (update for production)
NEXTAUTH_URL=https://your-domain.com
```

## Generating RSA Key Pair

Generate a private/public key pair for JWT signing:

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private_key.pem -pkcs8 -outform PEM -aes256

# Extract public key
openssl rsa -pubout -in private_key.pem -out public_key.pem

# View keys (copy these to your .env file)
cat private_key.pem
cat public_key.pem
```

## Canvas Configuration

### 1. Register Your Tool in Canvas

1. Go to Canvas Admin → Developer Keys
2. Click "+ Developer Key" → "+ LTI Key"
3. Fill in the configuration:

#### Basic Configuration
- **Key Name**: Your LMS Name
- **Owner Email**: your-email@domain.com
- **Redirect URIs**: `https://your-domain.com/api/lti/launch`
- **Method**: Manual Entry

#### Settings
```json
{
  "title": "Your LMS",
  "description": "Learning Management System Integration",
  "target_link_uri": "https://your-domain.com/api/lti/launch",
  "scopes": [
    "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
    "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
    "https://purl.imsglobal.org/spec/lti-ags/scope/score",
    "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly"
  ],
  "extensions": [
    {
      "domain": "your-domain.com",
      "tool_id": "your-lms",
      "platform": "canvas.instructure.com",
      "settings": {
        "privacy_level": "public",
        "placements": [
          {
            "text": "Your LMS",
            "enabled": true,
            "placement": "course_navigation",
            "message_type": "LtiResourceLinkRequest",
            "target_link_uri": "https://your-domain.com/api/lti/launch"
          },
          {
            "text": "Select LMS Content",
            "enabled": true,
            "placement": "assignment_selection",
            "message_type": "LtiDeepLinkingRequest",
            "target_link_uri": "https://your-domain.com/lti/deep-linking"
          }
        ]
      }
    }
  ],
  "public_jwk_url": "https://your-domain.com/api/lti/jwks",
  "custom_fields": {},
  "public_jwk": {}
}
```

### 2. Enable the Developer Key

1. After creating the key, set it to "On"
2. Note the **Client ID** (use this for `LTI_CLIENT_ID`)

### 3. Install in Course

1. Go to your course → Settings → Apps
2. Click "View App Configurations"
3. Click "+ App"
4. Select "By Client ID"
5. Enter your Client ID
6. Click "Submit"

## URL Endpoints

Your LMS provides these LTI endpoints:

- **JWKS URL**: `https://your-domain.com/api/lti/jwks`
- **Login URL**: `https://your-domain.com/api/lti/login`
- **Launch URL**: `https://your-domain.com/api/lti/launch`
- **Deep Linking**: `https://your-domain.com/lti/deep-linking`

## Testing

### 1. Basic Launch Test

1. Go to your Canvas course
2. Click "Your LMS" in the course navigation
3. You should be redirected to the LMS dashboard

### 2. Deep Linking Test

1. Create a new assignment in Canvas
2. Click "External Tool" as submission type
3. Find and select your LMS tool
4. You should see the guide selection interface

### 3. Grade Passback Test

1. Complete an assignment through the LTI integration
2. Submit a grade using the LMS grade API
3. Check that the grade appears in Canvas gradebook

## Troubleshooting

### Common Issues

1. **Invalid Client ID**: Check that `LTI_CLIENT_ID` matches Canvas
2. **JWT Verification Failed**: Ensure your private key is correct
3. **Unauthorized**: Check that the developer key is enabled in Canvas
4. **Deep Linking Not Working**: Verify placement configuration

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Logs

Check your application logs for LTI-related errors. Look for:
- Token validation errors
- Grade submission failures
- Authentication issues

## Security Notes

- Keep your private key secure and never commit it to version control
- Use HTTPS in production
- Validate all LTI tokens properly
- Implement proper session management
- Follow Canvas security guidelines

## API Usage

### Submit Grade to Canvas

```javascript
// Example: Submit a grade
const response = await fetch('/api/lti/grades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentUserId: 'lti-user-id',
    contextId: 'course-context',
    resourceLinkId: 'assignment-link',
    score: 85,
    maxScore: 100,
    comment: 'Great work!',
    activityProgress: 'Completed',
    gradingProgress: 'FullyGraded'
  })
});
```

For more information, see the [IMS Global LTI 1.3 specification](https://www.imsglobal.org/spec/lti/v1p3/).