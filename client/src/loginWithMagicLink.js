import { magic } from './magic';

export async function loginWithMagicLink(email) {
  try {
    // Magic SDK will call window.open(url) under the hood:
    await magic.auth.loginWithMagicLink({
      email,
      redirectURI: 'capacitor://localhost',
    });
  } catch (error) {
    console.error('Magic Link login error:', error);
    alert('Magic Link login failed: ' + error.message);
  }
}
