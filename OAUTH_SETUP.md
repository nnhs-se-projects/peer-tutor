# Google Sign-In Setup

The site uses [Google Identity Services](https://developers.google.com/identity/gsi/web): the "Sign in with Google" button gives the browser an ID token, and the server checks it with `google-auth-library` (`server/routes/auth.js`). There are no redirect URIs and no client secret.

## 1. Create the OAuth client

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select the project.
2. Under **APIs & Services > OAuth consent screen**, set up the app name ("NNHS Peer Tutoring") and support email. If the project belongs to the district's Google Workspace, choose **Internal**; otherwise choose **External** and add the people testing it as test users.
3. Under **APIs & Services > Credentials**, create an **OAuth client ID** of type **Web application**.
4. Under **Authorized JavaScript origins**, add every address the site is opened from, for example:
   - `http://localhost:8082` (and any other local port you use)
   - `https://peertutordev.nnhsse.org`

Leave **Authorized redirect URIs** empty.

## 2. Use the client ID

The team's client ID is the default in `server/routes/auth.js`. To use a different client, set it in `.env`:

```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Restart the server after changing `.env`.

## Who can sign in

Only verified District 203 Google accounts (`@naperville203.org` and `@stu.naperville203.org`) are accepted. Anyone else sees "Please sign in with your District 203 Google account."

## Troubleshooting

### "The given origin is not allowed for the given client ID"

The address in the browser isn't in **Authorized JavaScript origins**. Add it exactly (protocol, host, and port) and wait a few minutes for it to apply.

### The button doesn't appear

Check the browser console. Ad blockers and some privacy settings block `accounts.google.com`.

### "Authentication failed. Please try again."

The server couldn't verify the token, usually because `GOOGLE_CLIENT_ID` on the server doesn't match the client the page used.
