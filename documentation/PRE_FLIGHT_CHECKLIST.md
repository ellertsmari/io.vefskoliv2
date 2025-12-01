# Pre-Flight Checklist: Before You Start Canvas Integration

Use this checklist to ensure you're ready to integrate with Canvas.

## ✅ Infrastructure Ready

- [ ] **Your domain is live and accessible**
  - Test: Can you visit `https://your-domain.com` in a browser?
  - Must be HTTPS (not HTTP)
  
- [ ] **SSL certificate is valid**
  - No browser warnings when visiting your site
  - Certificate not expired
  
- [ ] **Application is deployed and running**
  - Can access the login page
  - Can create a test account and login
  
- [ ] **MongoDB is connected**
  - Application can read/write to database
  - No connection errors in logs

## ✅ Access & Permissions

- [ ] **Canvas Administrator Access**
  - Can access "Admin" section in Canvas
  - Can view "Developer Keys" menu
  - Have permission to create new keys
  
- [ ] **Test Canvas Course Available**
  - Have at least one course to test with
  - Preferably a sandbox/test course (not production)
  - Can create assignments in the course

## ✅ Technical Preparation

- [ ] **OpenSSL installed** (for key generation)
  ```bash
  # Test this works:
  openssl version
  ```
  
- [ ] **Can edit server configuration**
  - Access to `.env.local` file
  - Can restart the application
  - Know how to view application logs
  
- [ ] **Git repository access** (optional but recommended)
  - Can commit changes
  - Have a backup branch

## ✅ Documentation Review

- [ ] **Read the integration guide**
  - Reviewed `CANVAS_INTEGRATION_GUIDE.md`
  - Understand the three main flows (launch, deep linking, grades)
  
- [ ] **Understand environment variables needed**
  - Know where `.env.local` file is located
  - Understand each variable's purpose

## ✅ Pre-Configuration Test

Run these commands to verify your environment:

```bash
# 1. Check if OpenSSL works
openssl version

# 2. Check if your app is running
curl https://your-domain.com

# 3. Check if Node.js is correct version
node --version  # Should be 18+ or 20+

# 4. Check if you can restart the app (test the command)
pm2 list
# or
systemctl status your-service-name
# or know how to restart your Node process

# 5. Test MongoDB connection
# In your app, there should be a connection status log
```

## ✅ Information to Gather

Before starting, have these ready:

- [ ] **Your application's domain name**
  - Example: `https://vefskolinn.example.com`
  
- [ ] **Your Canvas instance URL**
  - Usually: `https://[institution].instructure.com`
  - Or custom domain: `https://canvas.[institution].edu`
  
- [ ] **Your email address**
  - For Canvas Developer Key owner field
  
- [ ] **Application restart method**
  - Know the exact command to restart
  - Example: `pm2 restart vefskolinn`
  - Or: `sudo systemctl restart vefskolinn-app`

## ✅ Backup & Safety

- [ ] **Have a backup of current `.env.local`**
  ```bash
  cp .env.local .env.local.backup
  ```
  
- [ ] **Test course created in Canvas**
  - Not a production course
  - Can safely test without affecting real students
  
- [ ] **Know how to rollback if needed**
  - Can restore previous `.env.local`
  - Can disable the tool in Canvas

## ✅ Time Allocation

Plan for these time blocks:

- [ ] **Key Generation:** 5-10 minutes
- [ ] **Environment Configuration:** 10-15 minutes
- [ ] **Canvas Developer Key Setup:** 15-20 minutes
- [ ] **Course Installation:** 5 minutes
- [ ] **Testing:** 15-20 minutes
- [ ] **Troubleshooting Buffer:** 30 minutes

**Total Time:** 1.5 - 2 hours (first time)

## ✅ Testing Plan

Prepare test scenarios:

- [ ] **Test User Accounts**
  - Have a teacher account in Canvas test course
  - Have a student account in Canvas test course
  - Know the login credentials for both
  
- [ ] **Test Content Ready**
  - Know which Vefskolinn guide to use for testing
  - Guide should be complete and viewable
  
- [ ] **Success Criteria Defined**
  - What does "working" look like?
  - Who will verify it's working correctly?

## ✅ Support Resources

Have these ready for reference:

- [ ] **Documentation URLs bookmarked**
  - Canvas API documentation
  - Your LTI setup files
  - IMS Global LTI spec (if needed)
  
- [ ] **Contact Information**
  - Canvas support (if you have it)
  - Your development team
  - System administrator
  
- [ ] **Monitoring Tools**
  - Know how to check application logs
  - Know how to check Canvas logs (if available)
  - Have error monitoring set up

## 🚀 Ready to Start?

If you've checked all boxes above, you're ready to begin!

**Next Steps:**
1. Start with: `CANVAS_INTEGRATION_GUIDE.md` - Step 1
2. Keep: `CANVAS_QUICK_REFERENCE.md` open for quick lookups
3. Refer to: `LTI_FLOW_DIAGRAM.md` if you need to understand what's happening
4. Use: `LTI_SETUP.md` for detailed technical information

## ⚠️ If You Can't Check All Boxes

**Don't proceed yet!** Here's what to do:

### Missing Infrastructure
→ Get your application deployed first
→ Ensure HTTPS is working
→ Test basic functionality

### Missing Permissions
→ Contact your Canvas administrator
→ Request Developer Keys access
→ Get a test course created

### Missing Knowledge
→ Read through all documentation first
→ Watch an LTI integration tutorial
→ Consider doing a practice run locally first

### Missing Time
→ Schedule a dedicated time block
→ Don't rush - integration requires focused attention
→ Better to wait than to rush and create issues

## 📞 Getting Help

If you're stuck on the pre-flight checklist:

1. **Infrastructure Issues**: Contact your hosting provider or DevOps team
2. **Canvas Access**: Contact your Canvas administrator
3. **Technical Questions**: Review the detailed setup docs or consult your development team
4. **SSL/HTTPS**: Contact your domain/hosting provider

## ✨ Confidence Check

Rate your readiness (1-5 scale):

- [ ] I understand what LTI integration does: ___/5
- [ ] I have all required access: ___/5
- [ ] I have sufficient time allocated: ___/5
- [ ] I know where to find help if stuck: ___/5

**If any score is below 3, address those areas before proceeding!**

---

**Ready? Let's do this! 🚀**

Start here: `CANVAS_INTEGRATION_GUIDE.md`
