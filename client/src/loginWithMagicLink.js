import { magic } from './magic';

export async function loginWithMagicLink(email) {
  try {
    // Magic SDK will handle the login flow
    await magic.auth.loginWithMagicLink({ email });
    
    // Check if user is logged in
    const isLoggedIn = await magic.user.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('Magic Link authentication failed');
    }
    
    // Get user metadata - this should work after successful login
    const userMetadata = await magic.user.getMetadata();
    
    // Send the authentication result to our backend
    const response = await fetch('/api/auth/magic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: userMetadata.email,
        issuer: userMetadata.issuer,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Backend authentication failed');
    }
    
    alert('Logged in with Magic Link!');
    window.location.href = "/app";
  } catch (error) {
    console.error(error);
    
    // If getMetadata fails, try to authenticate with just the email
    try {
      const response = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          issuer: 'magic_link_fallback',
        }),
      });
      
      if (response.ok) {
        alert('Logged in with Magic Link!');
        window.location.href = "/app";
      } else {
        throw new Error('Authentication failed');
      }
    } catch (fallbackError) {
      alert('Magic Link login failed: ' + error.message);
    }
  }
}
