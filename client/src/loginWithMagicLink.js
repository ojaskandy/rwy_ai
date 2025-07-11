import { magic } from './magic';

export async function loginWithMagicLink(email) {
  try {
    // Step 1: kick off the Magic Link flow
    await magic.auth.loginWithMagicLink({
      email,
      redirectURI: 'capacitor://localhost', // only this, no redirectMode
    });

    // 💥 Step 1.5: close the in-app browser if running inside Capacitor
    if (
      window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.Browser &&
      typeof window.Capacitor.Plugins.Browser.close === 'function'
    ) {
      await window.Capacitor.Plugins.Browser.close();
    }

    // Step 2: verify login and fetch user info
    const isLoggedIn = await magic.user.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Magic Link authentication failed');
    }
    const userInfo = await magic.user.getInfo();

    // Step 3: send session to your backend
    const response = await fetch('/api/auth/magic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: userInfo.email,
        issuer: userInfo.issuer,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Backend authentication failed');
    }
    const userData = await response.json();
    console.log('Magic Link login successful:', userData);

    // Step 4: navigate into your app
    window.location.href = '/app';
  } catch (error) {
    console.error('Magic Link login error:', error);
    alert('Magic Link login failed: ' + error.message);
  }
}
