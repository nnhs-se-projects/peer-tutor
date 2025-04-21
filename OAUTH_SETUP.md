# Google OAuth Setup Guide

To fix the "Error 400: redirect_uri_mismatch" issue, follow these steps to properly configure Google OAuth:

## 1. Access Google Cloud Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with the Google account that manages your OAuth credentials
3. Select your project or create a new one

## 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace)
3. Fill in the required app information:
   - App name: "NNHS Peer Tutoring"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes: `email` and `profile`
5. Add test users (if in testing mode): add your school email addresses
6. Save and continue

## 3. Create or Update OAuth Credentials

1. Navigate to **APIs & Services > Credentials**
2. Find your existing OAuth 2.0 Client ID or create a new one by clicking "Create Credentials > OAuth client ID"
3. For a new client, select **Web application** as the application type
4. Set a name for your client (e.g., "NNHS Peer Tutoring Web Client")
5. **Important**: Add the exact redirect URIs that match your application:
   - `http://localhost:8080/auth/google/callback` (for local development)
   - Add any production URLs if you're deploying to a live server
6. Click "Create" or "Save"

## 4. Update Your Environment Variables

Copy the Client ID and Client Secret from the Google Cloud Console and update your `.env` file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback
```

## 5. Restart Your Application

After updating your environment variables, restart your application for the changes to take effect.

## Troubleshooting

If you still see the "redirect_uri_mismatch" error:

1. Make sure the redirect URI in your code (`GOOGLE_CALLBACK_URL`) exactly matches what's configured in the Google Cloud Console
2. Check for trailing slashes - they matter! (`/callback` is different from `/callback/`)
3. Verify protocol matches (http vs https)
4. Clear your browser cache and cookies
5. Try using incognito mode for testing

## Error Messages & Solutions

### "Error 400: redirect_uri_mismatch"

This error occurs when the redirect URI provided in your authentication request doesn't match any of the URIs registered in the Google Cloud Console.

### "Access blocked: This app's request is invalid"

Check that your Client Secret is correct and that you've properly configured the OAuth consent screen.

### "Error 401: invalid_client"

Your Client ID or Client Secret is incorrect in your environment variables.

### "Error 403: access_denied"

The user denied access to your application during the consent screen.
