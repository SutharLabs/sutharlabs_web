# How to Obtain a Google Client ID

This guide walks you through the process of generating a Google Client ID for authenticating users via Google OAuth in this application.

## Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Log in with your Google account.
3. In the top-left navigation bar (next to the Google Cloud logo), click the **Project Dropdown** and click **New Project**.
4. Name it something recognizable (e.g., "SutharLabs Auth") and click **Create**. Make sure you select this new project once it's created.

## Step 2: Configure the OAuth Consent Screen
*Before Google gives you an ID, they need to know what users will see when they click "Continue with Google".*
1. On the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless this is strictly for users within a Google Workspace organization you own) and click **Create**.
3. Fill out the mandatory fields:
   - **App name**: e.g., "SutharLabs Workspace" (this is what users will see).
   - **User support email**: Your email.
   - **Developer contact information**: Your email.
4. Click **Save and Continue** through the "Scopes" and "Test Users" sections (you don't need to add anything special there, as the default configuration automatically grants access to the user's basic profile and email).
5. At the summary screen, click **Back to Dashboard**.

## Step 3: Generate the Client ID
1. On the left sidebar, navigate to **APIs & Services > Credentials**.
2. At the top, click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
3. Under **Application type**, select **Web application**.
4. Name the client (e.g., "Web Frontend").
5. **CRITICAL STEP - Authorized JavaScript origins**: 
   - Click **+ ADD URI**.
   - Enter your local development URL exactly as it runs in your browser. Typically this is `http://localhost:3000` or `http://localhost:5173`. *(Note: Do NOT add a trailing slash `/` at the end).*
6. **Authorized redirect URIs**: 
   - You can also add the exact same `http://localhost:3000` here.
7. Click **Create**.

## Step 4: Add it to your Environment Variables
A popup will appear containing your **Client ID** (a long string ending in `.apps.googleusercontent.com`). 
1. Copy that Client ID string.
2. Open the `.env` file located in the root of your project directory.
3. Find the `VITE_GOOGLE_CLIENT_ID` variable and paste your ID so it looks like this:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

Once saved, simply restart your development server, and the Google authentication integration will be fully operational.
