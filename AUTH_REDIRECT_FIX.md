# Fix for Authentication Redirect Issue

## Problem
When users click email verification or password reset links from Supabase, they get redirected to `localhost:5001` instead of the production URL `rwyai.app`.

## Solution

### 1. Environment Variable Setup

Add the following environment variable to your deployment:

```bash
VITE_SITE_URL=https://rwyai.app
```

**For different environments:**
- Development: `VITE_SITE_URL=http://localhost:5001`
- Production: `VITE_SITE_URL=https://rwyai.app`

### 2. Supabase Dashboard Configuration

In your Supabase dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://rwyai.app`
3. Add **Redirect URLs**:
   - `https://rwyai.app/auth/callback`
   - `https://rwyai.app/auth/reset-password`
   - `http://localhost:5001/auth/callback` (for development)
   - `http://localhost:5001/auth/reset-password` (for development)

### 3. Code Changes Made

The following files were updated to use the environment variable:

- `client/src/contexts/AuthContext.tsx` - Updated `signUp` and `resetPassword` functions
- `client/src/hooks/use-auth.tsx` - Updated `signUp` and `resetPassword` functions  
- `client/src/App.tsx` - Added new auth callback routes
- `client/src/pages/AuthCallback.tsx` - New component for email verification
- `client/src/pages/ResetPassword.tsx` - New component for password reset

### 4. New Features

- **Email Verification**: Users who click email verification links are redirected to `/auth/callback`
- **Password Reset**: Users who click password reset links are redirected to `/auth/reset-password`
- **Environment-based URLs**: Automatically uses the correct URL based on `VITE_SITE_URL` environment variable

### 5. Testing

1. Set `VITE_SITE_URL=http://localhost:5001` for local testing
2. Set `VITE_SITE_URL=https://rwyai.app` for production
3. Test email verification and password reset flows

### 6. Deployment

When deploying to production platforms:

1. **Vercel/Netlify**: Add `VITE_SITE_URL=https://rwyai.app` in environment variables
2. **Other platforms**: Set the environment variable in your deployment configuration

This ensures that all authentication redirect links will point to the correct domain regardless of where the development is happening. 