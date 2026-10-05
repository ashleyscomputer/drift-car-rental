export type UserRole = 'admin' | 'client';
export type AuthUser = { name: string; email: string; role: UserRole };
export const CHECKOUT_KEY = 'drift_checkout';
export async function readAuthUser(): Promise<AuthUser | null> {
  const response = await fetch('/api/auth/session', { cache: 'no-store' });
  if (!response.ok)
    throw new Error('Account services are unavailable. Please retry.');
  return ((await response.json()) as { user: AuthUser | null }).user;
}
export async function signOutUser() {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error('Sign out failed. Please retry.');
  localStorage.removeItem('drift_user');
  localStorage.removeItem('drift_orders');
  window.dispatchEvent(new Event('drift-auth-change'));
}
