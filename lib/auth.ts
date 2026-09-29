export type UserRole = 'admin' | 'client';
export type AuthUser = { name: string; email: string; role: UserRole };

export const AUTH_USER_KEY = 'drift_user';
export const CHECKOUT_KEY = 'drift_checkout';
export const ORDERS_KEY = 'drift_orders';

export function readAuthUser(): AuthUser | null {
  // Until MySQL sessions are implemented, cached browser roles are not trusted.
  return null;
}

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('drift-auth-change'));
}

export function signOutUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event('drift-auth-change'));
}