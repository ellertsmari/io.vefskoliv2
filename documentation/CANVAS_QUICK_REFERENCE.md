# Canvas Integration - Configure these URLs in CanvasConfigure these placements in Canvas Developer Key:

### Course Navigation
- **Label:** Vefskolinn
- **Target URI:** `https://io.vefskoli.is/api/lti/launch`
- **Message Type:** LtiResourceLinkRequest

### Assignment Selection (Deep Linking)
- **Label:** Select Vefskolinn Guide
- **Target URI:** `https://io.vefskoli.is/lti/deep-linking`
- **Message Type:** LtiDeepLinkingRequest

---

## 🎯 STEP 5: Enable Developer Key in Canvas

1. Go to Canvas Admin → Developer Keys
2. Find your "Vefskolinn" key
3. Toggle it to **ON**
4. Copy the **Client ID** and **Deployment ID**
5. Update `.env.local` with these values (see STEP 1)

---

## 🎯 STEP 6: Install App in Your Course

1. Go to your Canvas course
2. Settings → Apps → View App Configurations
3. Click "+ App"
4. Select "By Client ID"
5. Paste your Client ID
6. Click "Submit"

---

## 🧪 STEP 7: Testing Ordery:

| Field | Value |
|-------|-------|
| Redirect URI | `https://io.vefskoli.is/api/lti/launch` |
| Login URL | `https://io.vefskoli.is/api/lti/login` |
| Target Link URI | `https://io.vefskoli.is/api/lti/launch` |
| JWK URL | `https://io.vefskoli.is/api/lti/jwks` |
| Deep Linking | `https://io.vefskoli.is/lti/deep-linking` |

---

## 🎯 STEP 3: Required Scopes in Canvaslist

**Status:** ✅ Keys Generated | ✅ Environment Variables Set

## ✅ Already Done
- ✅ RSA keys generated and added to `.env.local`
- ✅ Environment variables configured in `.env.local`
- ✅ NEXTAUTH_URL set to `https://io.vefskoli.is`

---

## 🎯 STEP 1: Update Environment Variables from Canvas

After creating your Developer Key in Canvas, update these two values in `.env.local`:

```bash
# Open .env.local and update these lines:
LTI_CLIENT_ID=your_actual_client_id_from_canvas  # ⚠️ UPDATE THIS
LTI_DEPLOYMENT_ID=your_actual_deployment_id      # ⚠️ UPDATE THIS
```

---

## 🎯 STEP 2: Canvas Developer Key Configuration

| Field | Value |
|-------|-------|
| Redirect URI | `https://your-domain.com/api/lti/launch` |
| Login URL | `https://your-domain.com/api/lti/login` |
| Target Link URI | `https://your-domain.com/api/lti/launch` |
| JWK URL | `https://your-domain.com/api/lti/jwks` |
| Deep Linking | `https://your-domain.com/lti/deep-linking` |

Enable these scopes in Canvas Developer Key:
- ☐ AGS Line Item (create/view gradebook data)
- ☐ AGS Result (view gradebook data)
- ☐ AGS Score (create/update gradebook data)  
- ☐ NRPS (retrieve user data)

---

## 🎯 STEP 4: Placements Configuration

### Course Navigation
- **Label:** Vefskolinn
- **Target URI:** `/api/lti/launch`
- **Message Type:** LtiResourceLinkRequest

### Assignment Selection (Deep Linking)
- **Label:** Select Vefskolinn Guide
- **Target URI:** `/lti/deep-linking`
- **Message Type:** LtiDeepLinkingRequest

Test in this order:
1. ☐ Access Vefskolinn via course navigation menu
2. ☐ Create an assignment and select Vefskolinn content
3. ☐ Submit work and verify grade syncs back to Canvas

---

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| "Invalid Client ID" | Check `LTI_CLIENT_ID` matches Canvas exactly |
| "Token verification failed" | Verify private key format in `.env.local` |
| Tool not in menu | Enable Developer Key in Canvas, refresh page |
| Deep linking fails | Check placement config & message type |
| Grade not syncing | Verify AGS scopes are enabled |

---

## ✅ Quick Verification

Before testing, verify:
- ☐ Visit `https://io.vefskoli.is/api/lti/jwks` → Should return public key JSON
- ☐ Canvas Admin → Developer Keys → Your key is "ON"
- ☐ `.env.local` has correct `LTI_CLIENT_ID` and `LTI_DEPLOYMENT_ID`

---

## 📚 Full Documentation
- Detailed guide: `CANVAS_INTEGRATION_GUIDE.md`
- Technical details: `LTI_SETUP.md`
- Canvas docs: https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html

---

## 🎯 YOUR TODO LIST

1. ☐ Create Developer Key in Canvas (see STEP 2)
2. ☐ Copy Client ID and Deployment ID from Canvas
3. ☐ Update `.env.local` with these IDs (see STEP 1)
4. ☐ Enable required scopes (see STEP 3)
5. ☐ Configure placements (see STEP 4)
6. ☐ Turn Developer Key ON in Canvas (see STEP 5)
7. ☐ Install app in your course (see STEP 6)
8. ☐ Test the integration (see STEP 7)
