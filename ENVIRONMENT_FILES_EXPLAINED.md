# Environment Files - Questions Answered

**Date:** October 9, 2025

---

## ❓ Question 1: What environment variables do I need to copy to Vercel?

**Answer:** All **17 environment variables** from `.env.local`

See the complete list with copy instructions in: **`VERCEL_ENVIRONMENT_VARIABLES.md`**

### Quick Summary:
- **5** existing variables (MongoDB, Auth, Zoom)
- **12** new LTI variables (Canvas URLs, keys, credentials)

### Easiest Method:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Click **"Import .env File"**
3. Upload your `.env.local` file
4. Select **Production** environment
5. Done! ✅

---

## ❓ Question 2: Do I need .env.local.lti anymore?

**Answer:** ⚠️ **KEEP IT AS BACKUP** but you don't actively use it

### Why Keep It?
- **Backup** of your RSA keys (very important!)
- **Documentation** of original LTI configuration
- **Recovery** if `.env.local` gets corrupted

### Current State:
- ✅ `.env.local` - **ACTIVE** (used by Next.js, has everything)
- 📦 `.env.local.lti` - **BACKUP** (ignored by git, safe to keep)
- 📄 `.env.lti.example` - **FOR DEVELOPERS** (now tracked in git!)

### Recommendation:
```bash
# Keep both files locally for safety:
.env.local         # Active configuration (ignored by git)
.env.local.lti     # Backup copy (ignored by git)

# Only this is in git for developers:
.env.lti.example   # Template (NOW PUSHABLE! ✅)
```

---

## ❓ Question 3: Why can't I push .env.lti.example to git?

**Answer:** ✅ **FIXED!** The `.gitignore` pattern was too broad

### The Problem:
Your `.gitignore` had this pattern:
```gitignore
.env*    # ❌ This caught .env.lti.example too!
```

### The Fix (Applied):
```gitignore
.env*
# But allow example files for developers
!.env*.example
!.env.example
```

### Verification:
```bash
# .env.lti.example is now staged and ready to commit
git status .env.lti.example
# Changes to be committed:
#   new file:   .env.lti.example
```

### Next Steps:
```bash
# Commit and push the example file
git commit -m "Add .env.lti.example template for developers"
git push origin lti

# Now developers can clone and copy:
# cp .env.lti.example .env.local
```

---

## 📋 File Status Summary

| File | Purpose | Git Status | Active? |
|------|---------|------------|---------|
| `.env.local` | Production config | ❌ Ignored | ✅ YES |
| `.env.local.lti` | Backup | ❌ Ignored | ⚠️ Backup only |
| `.env.lti.example` | Developer template | ✅ **NOW TRACKED** | 📄 Example |

---

## 🎯 What to Do Now

### 1. Stop Emailing Developers! 😅
```bash
# Just push the example file:
git add .env.lti.example .gitignore
git commit -m "Fix: Allow .env example files in git for developer onboarding"
git push origin lti
```

### 2. Update Your README
Add this section to your README:

```markdown
## Environment Setup

1. Copy the example file:
   \`\`\`bash
   cp .env.lti.example .env.local
   \`\`\`

2. Update these placeholder values:
   - `LTI_CLIENT_ID` - From Canvas Developer Key
   - `LTI_DEPLOYMENT_ID` - From Canvas
   - `MONGODB_CONNECTION` - Your database
   - Generate your own RSA keys (see example file)

3. Generate RSA keys:
   \`\`\`bash
   openssl genrsa -out lti_private_key.pem 2048
   openssl rsa -in lti_private_key.pem -pubout -out lti_public_key.pem
   \`\`\`
```

### 3. Deploy to Vercel
Follow **`VERCEL_ENVIRONMENT_VARIABLES.md`** to copy all 17 variables

### 4. Clean Up Email Chaos
Send one final email:
> "Hi team! 🎉
> 
> Good news - the .env.lti.example file is now in the repo!
> 
> Just pull the latest from the `lti` branch and run:
> `cp .env.lti.example .env.local`
> 
> Then follow the instructions in the file to generate your keys.
> 
> No more email attachments! 😊"

---

## 🔒 Security Notes

### What's Ignored (Safe):
- `.env.local` ✅
- `.env.local.lti` ✅
- `.env*.local` ✅
- Any `.env.production`, `.env.development` ✅

### What's Tracked (Safe):
- `.env.lti.example` ✅ (no real secrets, just placeholders)

### What's NOT Safe:
- ❌ Never commit real keys/secrets
- ❌ Never share `.env.local` via email (use secure channels)
- ✅ Use example files with `REPLACE_WITH_YOUR_KEY` placeholders

---

## 📚 Related Documentation

- **`VERCEL_ENVIRONMENT_VARIABLES.md`** - How to deploy to Vercel
- **`CANVAS_QUICK_REFERENCE.md`** - Canvas setup steps
- **`ENVIRONMENT_SETUP_COMPLETE.md`** - What's already done
- **`.env.lti.example`** - Template for developers

---

## Need Help?

**For Developers:**
1. Pull latest code
2. Copy `.env.lti.example` → `.env.local`
3. Follow instructions in the example file

**For Deployment:**
1. See `VERCEL_ENVIRONMENT_VARIABLES.md`
2. Import your `.env.local` to Vercel
3. Redeploy

**For Canvas Integration:**
1. See `CANVAS_QUICK_REFERENCE.md`
2. Create Developer Key
3. Update `LTI_CLIENT_ID` and `LTI_DEPLOYMENT_ID`
