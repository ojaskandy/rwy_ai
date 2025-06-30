# Mobile Authentication Testing Guide

## Quick Testing Steps

### 1. Start your server
```bash
cd "CoachT 4"
npm run dev
```

### 2. Open your mobile app and try these tests:

#### Test A: Use the Debug Button
1. Open the login page on your mobile app
2. Click the **"🔍 Debug Token (Test Only)"** button (yellow button)
3. Complete Google sign-in
4. Check the console logs and alert dialog for detailed token information

#### Test B: Try Normal Login
1. Click the regular **"Continue with Google"** button (blue button)  
2. Complete Google sign-in
3. Check console logs for detailed debugging information

### 3. Check Console Logs

Look for these specific log patterns:

**Frontend logs:**
```
🚀 Starting mobile Google login...
=== MOBILE GOOGLE LOGIN DEBUG ===
JWT Header: {...}
JWT Payload: {...}
✅ Token validation passed, sending to backend...
```

**Backend logs:**
```
=== MOBILE LOGIN BACKEND DEBUG ===
Token verification successful!
Mobile login successful for user: username
```

### 4. Common Issues to Check

#### Issue A: Token Format Problems
**Symptoms:** 
- Frontend shows "Invalid JWT format" error
- Token doesn't have 3 parts

**Solutions:**
- Check if token contains spaces or newlines
- Verify token starts with 'ey'

#### Issue B: Pattern Mismatch Error  
**Symptoms:**
- Backend shows "🔍 PATTERN MISMATCH ERROR DETECTED!"
- Error message: "string did not match the expected pattern"

**Solutions:**
- Check token base64 encoding
- Verify JWT structure is valid

#### Issue C: Audience Mismatch
**Symptoms:**
- Token decodes successfully but verification fails
- Backend shows "Audience match: false"

**Solutions:**
- Verify client IDs match between frontend and backend
- Check environment variables are loaded correctly

### 5. Debug Endpoint Results

The debug endpoint will return JSON with:
```json
{
  "formatChecks": {
    "hasThreeParts": true,
    "startsWithEy": true,
    "containsSpecialChars": false
  },
  "decodedInfo": {
    "header": {...},
    "payload": {
      "aud": "your-client-id",
      "iss": "https://accounts.google.com"
    }
  },
  "verificationResult": {
    "success": true/false,
    "error": "specific error message"
  }
}
```

### 6. Next Steps Based on Results

**If formatChecks show issues:**
- Token is malformed - check Capacitor plugin configuration

**If decodedInfo shows wrong audience:**
- Client ID mismatch - verify environment variables

**If verificationResult fails:**
- Check the specific error message for Google Auth Library issues

## Expected Working Flow

1. ✅ Frontend: Token extracted successfully  
2. ✅ Frontend: Token has 3 parts, starts with 'ey'
3. ✅ Frontend: JWT decodes showing correct audience
4. ✅ Backend: Token received and cleaned
5. ✅ Backend: JWT decoded successfully  
6. ✅ Backend: Audience matches expected client IDs
7. ✅ Backend: Google verification succeeds
8. ✅ Backend: User logged in successfully

## Emergency Fallback

If all else fails, try using the `serverAuthCode` instead of `idToken`:

1. Check debug logs for `serverAuthCode` field
2. Consider implementing server-side token exchange flow
3. Use Google's OAuth2 token exchange API

---

**Run these tests and share the console output - especially any errors from the debug endpoint!** 