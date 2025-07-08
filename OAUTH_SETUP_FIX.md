# Google OAuth Setup Fix - Redirect URI Error

## Problem
You're getting this error when trying to authenticate:
```
Access blocked: Authorization Error
Missing required parameter: redirect_uri
Error 400: invalid_request
```

## Root Cause
The Google OAuth client is missing the proper redirect URI configuration for Chrome extensions.

## Solution: Complete Google Cloud Console Setup

### Step 1: Get Your Extension ID

1. **Build the extension:**
   ```bash
   npm run build
   ```

2. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from your project
   - **Copy the Extension ID** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Step 2: Configure Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Select your project** (or create a new one)

3. **Enable APIs:**
   - Go to "APIs & Services" → "Library"
   - Search for and enable "Google+ API" (or "People API")

4. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Choose "Web application" (NOT Chrome extension)

5. **Configure the OAuth Client:**
   - **Name:** `Family Privacy Extension`
   - **Authorized JavaScript origins:** 
     ```
     chrome-extension://YOUR_EXTENSION_ID_HERE
     ```
   - **Authorized redirect URIs:**
     ```
     chrome-extension://YOUR_EXTENSION_ID_HERE/
     https://YOUR_EXTENSION_ID_HERE.chromiumapp.org/
     ```

6. **Save and copy the Client ID**

### Step 3: Update Extension Configuration

1. **Update `.env.local`:**
   ```bash
   GOOGLE_CLIENT_ID=your-new-client-id.apps.googleusercontent.com
   ```

2. **Update `src/manifest.json`:**
   ```json
   {
     "oauth2": {
       "client_id": "your-new-client-id.apps.googleusercontent.com",
       "scopes": ["openid", "email", "profile"]
     }
   }
   ```

### Step 4: Rebuild and Test

1. **Rebuild the extension:**
   ```bash
   npm run build
   ```

2. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Click the reload button on your extension

3. **Test authentication:**
   - Click the extension icon
   - Click "Sign In with Google"
   - Should now work without redirect URI errors

## Important Notes

- **Extension ID changes** every time you load an unpacked extension from a different folder
- **Use the same dist folder** to keep the same extension ID
- **For production:** Publish to Chrome Web Store to get a permanent ID
- **Redirect URIs must match exactly** (including the trailing slash)

## Alternative: Use Extension Key for Consistent ID

To keep the same extension ID during development:

1. **Generate a key pair:**
   ```bash
   openssl genrsa -out key.pem 2048
   openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A
   ```

2. **Add to manifest.json:**
   ```json
   {
     "key": "YOUR_BASE64_PUBLIC_KEY_HERE"
   }
   ```

This ensures the extension ID stays consistent across rebuilds.

## Troubleshooting

- **"Invalid client"**: Client ID doesn't match
- **"Redirect URI mismatch"**: Extension ID changed or wrong URI format
- **"Access blocked"**: OAuth consent screen not configured properly

Follow these steps exactly and the authentication should work!
