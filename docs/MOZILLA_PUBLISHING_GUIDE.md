# 🚀 Automated Extension Publishing - Tag-Only Workflow

## 📋 What's Been Set Up

Your project now has **automated building and publishing** for both Chrome and Firefox extensions that **only triggers on version tags** (not regular pushes).

### ✅ **Workflow Behavior**
- **Regular pushes to main**: ❌ No builds triggered
- **Version tags (v1.0.0, etc.)**: ✅ Build + Publish automatically

### ✅ **What Happens on Version Tags**
1. **Build Chrome Extension** (.crx file)
2. **Build Firefox Extension** (.zip file)  
3. **Publish to Mozilla Add-ons** (automatic)
4. **Upload artifacts** for download
5. **Send notifications** via Telegram

## 🔑 **Required Setup Steps**

### 1. Get Mozilla API Credentials
Visit: https://addons.mozilla.org/developers/addon/api/key/

Create API key pair and add to GitHub Secrets:
```
AMO_JWT_ISSUER: [Your JWT Issuer]
AMO_JWT_SECRET: [Your JWT Secret]
```

### 2. Extension ID Setup
Your `manifest.json` already has Firefox configuration:
```json
"browser_specific_settings": {
  "gecko": {
    "id": "admin@paradox-bd.com",
    "strict_min_version": "109.0"
  }
}
```

## 🚀 **How to Trigger Build & Publish**

### Create and Push Version Tag
```bash
# Create a version tag
git tag v1.0.0

# Push the tag to trigger workflow
git push origin v1.0.0
```

### Alternative: Create Release via GitHub UI
1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Create a new tag (e.g., `v1.0.1`)
4. Publish release

**Result**: 
- ✅ Chrome extension built → Available as artifact
- ✅ Firefox extension built → **Automatically published to Mozilla Add-ons**
- ✅ Telegram notifications sent
- ✅ Signed .xpi file available for download

## 📊 **Workflow Overview**

```
Tag Push (v1.0.0) → Build Chrome → Build Firefox → Publish to Mozilla → Notify
     ↓                ↓              ↓                ↓                ↓
   Trigger           .crx           .zip        Submit for review    Telegram
```

## 🎯 **Testing the Setup**

### 1. Test Firefox Build Locally (Optional)
```bash
npm run firefox:build
npm run firefox:lint
```

### 2. Test Production Release
```bash
# Create version tag to trigger full workflow
git tag v1.0.0
git push origin v1.0.0
```

## 📁 **Artifacts Generated**

After successful workflow run, you'll have:

```
Artifacts (downloadable from GitHub Actions):
├── chrome-extension-crx-v[run-number]     # Chrome .crx file
├── firefox-extension-zip-v[run-number]    # Firefox .zip file
├── firefox-extension-signed-v[tag]        # Signed .xpi file
└── extension-dist-v[run-number]           # Source dist folder
```

## ⚠️ **Important Notes**

1. **No builds on regular pushes**: Only version tags trigger the workflow
2. **First-time publishing**: You must publish your Firefox extension to Mozilla Add-ons **manually once** to get it approved
3. **Review process**: Mozilla reviews can take 1-7 days for listed extensions
4. **Chrome publishing**: Still requires manual upload to Chrome Web Store

## 🔧 **Available NPM Scripts**

```bash
npm run firefox:build    # Build Firefox extension locally
npm run firefox:lint     # Validate Firefox compatibility  
npm run firefox:sign     # Sign extension with Mozilla API (requires keys)
```

## 🐛 **Troubleshooting**

### Workflow Not Triggering?
- Make sure you're pushing **tags**, not just commits
- Check tag format: `v1.0.0`, `v2.1.3`, etc.

### Common Publishing Issues:
- **"Extension not found"**: Must publish manually to Mozilla once first
- **"Authentication failed"**: Check GitHub secrets are set correctly
- **"Build failed"**: Run `npm run firefox:lint` locally first

### Debug Commands:
```bash
# Check current tags
git tag -l

# Check extension validity
npm run firefox:lint

# Test build process
npm run firefox:build
```

---

## 🎉 **Summary**

Your extension workflow is now optimized for **release-only building**:

- ✅ **Clean workflow**: No unnecessary builds on every commit
- ✅ **Version-controlled**: Only builds when you create releases
- ✅ **Automatic publishing**: Firefox extensions go straight to Mozilla Add-ons
- ✅ **Production-ready**: Perfect for maintaining stable releases

**Next step**: Add your Mozilla API credentials to GitHub Secrets and test with `git tag v1.0.0 && git push origin v1.0.0`!