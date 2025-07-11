
import { magic } from './magic';

export async function loginWithMagicLink(email) {
  try {
    await magic.auth.loginWithMagicLink({ email });
    alert('Logged in with Magic Link!');
    window.location.href = "/dashboard"; // Change to your desired route
  } catch (error) {
    console.error(error);
    alert('Magic Link login failed: ' + error.message);
  }
}
