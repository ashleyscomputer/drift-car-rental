export type UserRole = 'admin' | 'client';
export type AuthUser = { name: string; email: string; role: UserRole };

export const AUTH_USER_KEY = 'drift_user';
export const CHECKOUT_KEY = 'drift_checkout';
export const ORDERS_KEY = 'drift_orders';

export function readAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null') as AuthUser | null;
    return value?.email && (value.role === 'admin' || value.role === 'client') ? value : null;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('drift-auth-change'));
}

export function signOutUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event('drift-auth-change'));
}