# Chrome Extension Authentication Solution

## The Problem with Clerk

Chrome extensions have strict Content Security Policy (CSP) restrictions that prevent loading external JavaScript libraries like Clerk, even from trusted domains. This is by design for security reasons and cannot be bypassed.

**The Error:**
```
'content_security_policy.extension_pages': Insecure CSP value "https://clerk.accounts.dev" in directive 'script-src'.
```

Chrome will not allow any external domain in the `script-src` directive for extension pages, making Clerk unusable in Chrome extensions.

## Recommended Solutions

### Option 1: Chrome Identity API with OAuth (✅ IMPLEMENTED)

Use Chrome's built-in Identity API with Google OAuth or other providers:

**Pros:**
- Works within Chrome's security model
- No CSP issues
- Built-in Chrome extension support
- Secure token management

**Cons:**
- Limited to OAuth providers (Google, GitHub, etc.)
- Requires more setup than Clerk
- Less UI customization

### Option 2: Custom Backend Authentication

Create your own authentication server and communicate via API:

**Pros:**
- Full control over authentication flow
- Can integrate with any authentication provider
- Custom UI and branding

**Cons:**
- Requires backend development
- More complex to implement
- Need to handle security yourself

### Option 3: Firebase Authentication

Use Firebase Auth which has Chrome extension support:

**Pros:**
- Google-managed service
- Works with Chrome extensions
- Good documentation
- Multiple auth providers

**Cons:**
- Still requires careful CSP configuration
- Vendor lock-in to Google ecosystem

## Implementation: Chrome Identity API with Google OAuth

I've implemented **Option 1** as it's the most straightforward and secure solution.

### Files Modified

1. **`src/lib/auth-service.ts`** - New Chrome Identity API service
2. **`src/popup/main.tsx`** - Removed Clerk provider
3. **`src/popup/Popup.tsx`** - Updated to use Chrome Identity API
4. **`src/options/options.tsx`** - Updated to use Chrome Identity API
5. **`src/manifest.json`** - Added OAuth2 configuration, removed Clerk CSP
6. **`.env.local`** - Updated for Google OAuth configuration

### Setup Instructions

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or Google People API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Chrome extension** application type
6. Add your extension ID to authorized JavaScript origins:
   - Format: `chrome-extension://YOUR_EXTENSION_ID`
7. Copy the generated Client ID

#### 2. Update Configuration Files

**Update `.env.local`:**
```bash
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
```

**Update `src/manifest.json`:**
```json
{
  "oauth2": {
    "client_id": "your-actual-client-id.apps.googleusercontent.com",
    "scopes": ["openid", "email", "profile"]
  }
}
```

#### 3. Get Your Extension ID

1. Build the extension: `npm run build`
2. Load unpacked extension in Chrome from the `dist` folder
3. Copy the extension ID from `chrome://extensions/`
4. Add this ID to your Google OAuth configuration

### How It Works

#### Authentication Service (`auth-service.ts`)

- **`signIn()`**: Uses `chrome.identity.getAuthToken()` to authenticate
- **`signOut()`**: Removes cached tokens and clears local storage
- **`useAuth()`**: React hook for authentication state
- **Persistent Sessions**: Tokens are stored locally and validated on startup

#### User Data Structure

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}
```

#### Usage in Components

```tsx
import { useAuth } from '../lib/auth-service';

function MyComponent() {
  const { isAuthenticated, user, signIn, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={signIn}>Sign In with Google</button>;
  }
  
  return (
    <div>
      <img src={user.picture} alt="Profile" />
      <p>{user.name}</p>
      <p>{user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Browser Compatibility

#### ✅ Google Chrome
- Full Chrome Identity API support
- Complete authentication features
- All functionality available

#### ⚠️ Microsoft Edge
- **Chrome Identity API is NOT supported** on Edge
- Users will see a helpful message explaining the limitation
- Extension works in "guest mode" with limited features
- Authentication requires switching to Google Chrome

#### Error Handling
The extension automatically detects Edge browser and:
- Shows user-friendly messages instead of errors
- Provides clear instructions to switch browsers
- Gracefully degrades functionality where possible

### Error Messages You Might See

**On Microsoft Edge:**
```
This API is not supported on Microsoft Edge. For more details, see extensions API documentation https://go.microsoft.com/fwlink/?linkid=2186907
```

This is expected behavior. The extension will show:
- "Authentication is not supported on Microsoft Edge"
- "Please use Google Chrome to sign in"
- Option to use extension in guest mode with limited features

### Testing

1. Build the extension: `npm run build`
2. Load the unpacked extension in Chrome
3. Click the extension icon to open the popup
4. Click "Sign In with Google"
5. Complete the OAuth flow
6. Your profile information should appear

### Troubleshooting

**Common Issues:**

1. **"OAuth client not found"**
   - Verify your Client ID in manifest.json matches Google Console
   - Ensure the extension ID is added to authorized origins

2. **"Error getting auth token"**
   - Check that Google+ API is enabled
   - Verify OAuth consent screen is configured

3. **"User cancelled"**
   - Normal behavior when user closes OAuth popup
   - Try signing in again

### Migration from Clerk

All Clerk-specific code has been removed and replaced with Chrome Identity API:

- ❌ `@clerk/clerk-react` package removed
- ❌ `ExtensionClerkProvider` removed
- ❌ Clerk CSP directives removed
- ✅ Chrome Identity API implemented
- ✅ Google OAuth configuration added
- ✅ User profile data preserved

The extension now works within Chrome's security constraints while providing secure authentication!
